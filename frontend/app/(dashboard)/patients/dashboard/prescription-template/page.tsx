"use client"

import * as React from "react"
import { useScribeStore, SafeZone } from "@/lib/mock-store"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Upload, Trash2, CheckCircle, Move, Loader2, Image as ImageIcon } from "lucide-react"

// Pixel safe-zone used only while drawing in the canvas editor
interface PixelZone {
  x: number
  y: number
  width: number
  height: number
}

export default function PrescriptionTemplatePage() {
  const { prescriptionTemplate, setPrescriptionTemplate } = useScribeStore()

  const [mounted, setMounted]           = React.useState(false)
  const [imageFile, setImageFile]       = React.useState<File | null>(null)
  const [localDataUrl, setLocalDataUrl] = React.useState<string | null>(null)
  const [pixelZone, setPixelZone]       = React.useState<PixelZone>({ x: 0, y: 0, width: 0, height: 0 })
  const [fontSizePt, setFontSizePt]     = React.useState(10)
  const [lineHeightPt, setLineHeightPt] = React.useState(16)
  const [isSaving, setIsSaving]         = React.useState(false)
  const [isDeleting, setIsDeleting]     = React.useState(false)

  const canvasRef     = React.useRef<HTMLCanvasElement>(null)
  const imgObjRef     = React.useRef<HTMLImageElement | null>(null)
  const isDrawingRef  = React.useRef(false)
  const startPosRef   = React.useRef({ x: 0, y: 0 })
  const initialized   = React.useRef(false)

  React.useEffect(() => { setMounted(true) }, [])

  // When template loads from store, restore state for existing template
  React.useEffect(() => {
    if (!prescriptionTemplate || initialized.current) return
    initialized.current = true

    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      imgObjRef.current = img
      const sz = prescriptionTemplate.safeZone
      const w  = img.naturalWidth
      const h  = img.naturalHeight
      setPixelZone({
        x:      sz.xPct      * w,
        y:      sz.yPct      * h,
        width:  sz.widthPct  * w,
        height: sz.heightPct * h,
      })
      setFontSizePt(sz.fontSizePt)
      setLineHeightPt(sz.lineHeightPt)
      drawCanvas(img, { x: sz.xPct * w, y: sz.yPct * h, width: sz.widthPct * w, height: sz.heightPct * h })
    }
    img.src = prescriptionTemplate.imageUrl
  }, [prescriptionTemplate]) // eslint-disable-line react-hooks/exhaustive-deps

  function drawCanvas(img: HTMLImageElement, zone: PixelZone) {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width  = img.naturalWidth
    canvas.height = img.naturalHeight
    ctx.drawImage(img, 0, 0)

    if (zone.width > 2 && zone.height > 2) {
      ctx.strokeStyle = "rgba(32, 80, 96, 0.9)"
      ctx.lineWidth   = Math.max(2, img.naturalWidth / 400)
      ctx.setLineDash([8, 4])
      ctx.strokeRect(zone.x, zone.y, zone.width, zone.height)

      ctx.fillStyle = "rgba(32, 80, 96, 0.08)"
      ctx.fillRect(zone.x, zone.y, zone.width, zone.height)

      const labelFontSize = Math.max(10, img.naturalWidth / 80)
      ctx.setLineDash([])
      ctx.font      = `bold ${labelFontSize}px sans-serif`
      ctx.fillStyle = "rgba(32, 80, 96, 0.9)"
      ctx.fillText("Safe zone", zone.x + 4, zone.y + labelFontSize + 2)
    }
  }

  const loadImageFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      setLocalDataUrl(dataUrl)
      const img = new Image()
      img.onload = () => {
        imgObjRef.current = img
        const zone = { x: 0, y: 0, width: 0, height: 0 }
        setPixelZone(zone)
        drawCanvas(img, zone)
      }
      img.src = dataUrl
    }
    reader.readAsDataURL(file)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      toast.error("Please upload a JPG or PNG image.")
      return
    }
    setImageFile(file)
    initialized.current = true
    loadImageFile(file)
    toast.success("Image loaded — draw the safe zone below.")
  }

  const getCanvasPos = (e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } => {
    const canvas = canvasRef.current!
    const rect   = canvas.getBoundingClientRect()
    const scaleX = canvas.width  / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top)  * scaleY,
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const img = imgObjRef.current
    if (!img) return
    const pos = getCanvasPos(e)
    startPosRef.current = pos
    setPixelZone({ x: pos.x, y: pos.y, width: 0, height: 0 })
    isDrawingRef.current = true
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !imgObjRef.current) return
    const pos  = getCanvasPos(e)
    const zone = {
      x:      Math.min(startPosRef.current.x, pos.x),
      y:      Math.min(startPosRef.current.y, pos.y),
      width:  Math.abs(pos.x - startPosRef.current.x),
      height: Math.abs(pos.y - startPosRef.current.y),
    }
    setPixelZone(zone)
    drawCanvas(imgObjRef.current, zone)
  }

  const handleMouseUp = () => { isDrawingRef.current = false }

  const hasImage = !!(imgObjRef.current && (localDataUrl || prescriptionTemplate?.imageUrl))
  const hasZone  = pixelZone.width > 2 && pixelZone.height > 2

  const handleSave = async () => {
    const img = imgObjRef.current
    if (!img) { toast.error("Please upload an image first."); return }
    if (!hasZone) { toast.error("Please draw the safe writing area on the image."); return }

    setIsSaving(true)
    try {
      const safeZone: SafeZone = {
        xPct:         pixelZone.x      / img.naturalWidth,
        yPct:         pixelZone.y      / img.naturalHeight,
        widthPct:     pixelZone.width  / img.naturalWidth,
        heightPct:    pixelZone.height / img.naturalHeight,
        fontSizePt,
        lineHeightPt,
      }

      if (imageFile) {
        // New image — POST to create/replace template
        const fd = new FormData()
        fd.append("image", imageFile)
        fd.append("meta", JSON.stringify({
          imageWidth:  img.naturalWidth,
          imageHeight: img.naturalHeight,
          safeZone,
        }))
        const res = await fetch("/api/prescription-templates", { method: "POST", body: fd })
        if (!res.ok) throw new Error((await res.json()).error ?? "Save failed")
        const { template } = await res.json()
        setPrescriptionTemplate(template)
        setImageFile(null)
      } else if (prescriptionTemplate) {
        // Existing image — PATCH safe zone only
        const res = await fetch(`/api/prescription-templates/${prescriptionTemplate.id}`, {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ safeZone }),
        })
        if (!res.ok) throw new Error((await res.json()).error ?? "Update failed")
        setPrescriptionTemplate({ ...prescriptionTemplate, safeZone })
      }

      toast.success("Template saved.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save template.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemove = async () => {
    if (!prescriptionTemplate) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/prescription-templates/${prescriptionTemplate.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error((await res.json()).error ?? "Delete failed")
      setPrescriptionTemplate(null)
      setLocalDataUrl(null)
      setImageFile(null)
      setPixelZone({ x: 0, y: 0, width: 0, height: 0 })
      imgObjRef.current = null
      initialized.current = false
      const canvas = canvasRef.current
      if (canvas) { const ctx = canvas.getContext("2d"); ctx?.clearRect(0, 0, canvas.width, canvas.height) }
      toast.success("Template removed.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove template.")
    } finally {
      setIsDeleting(false)
    }
  }

  if (!mounted) return null

  return (
    <div className="flex flex-col w-full animate-in fade-in duration-500 max-w-4xl">
      <PageHeader
        title="Prescription template"
        description="Upload your clinic letterhead and draw the area where prescription text should be printed."
      />

      <div className="grid gap-10">
        {/* Upload */}
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-foreground">Prescription pad image</h2>
            <p className="text-xs text-muted-foreground">
              Upload a JPG or PNG scan of your letterhead. Used as the PDF background.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="secondary" className="gap-2 h-9 text-xs font-medium bg-muted/50 border border-border" asChild>
              <label className="cursor-pointer">
                <Upload className="size-3.5" />
                {hasImage ? "Replace image…" : "Choose image…"}
                <input type="file" className="hidden" accept="image/jpeg,image/png" onChange={handleImageUpload} />
              </label>
            </Button>
            {hasImage && !imageFile && (
              <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold">
                <CheckCircle className="size-3.5" />
                Template saved
              </div>
            )}
            {imageFile && (
              <span className="text-xs text-muted-foreground">New image — draw safe zone and save</span>
            )}
          </div>
        </div>

        {/* Canvas editor */}
        {hasImage ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Move className="size-3.5 text-muted-foreground" />
                Draw the safe writing area
              </div>
              <p className="text-xs text-muted-foreground">
                Click and drag on the image to mark where prescription text should appear.
              </p>
            </div>

            <div className="p-1 sm:p-4 bg-muted/20 border border-border rounded-xl flex justify-center overflow-hidden">
              <canvas
                ref={canvasRef}
                className="max-w-full h-auto block border border-border shadow-sm rounded-md cursor-crosshair select-none"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ imageRendering: "auto" }}
              />
            </div>

            <div className="text-[11px] text-muted-foreground/80">
              {hasZone
                ? `Safe zone: ${Math.round(pixelZone.width)} × ${Math.round(pixelZone.height)} px at (${Math.round(pixelZone.x)}, ${Math.round(pixelZone.y)})`
                : "No safe zone drawn yet — drag to mark the writing area"}
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-[320px]">
              <div className="space-y-2">
                <Label htmlFor="fontSize" className="text-xs font-semibold">Font size (pt)</Label>
                <Input
                  id="fontSize"
                  type="number"
                  min={7}
                  max={16}
                  value={fontSizePt}
                  className="h-9 bg-muted/10 text-sm border-border"
                  onChange={e => setFontSizePt(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lineHeight" className="text-xs font-semibold">Line height (pt)</Label>
                <Input
                  id="lineHeight"
                  type="number"
                  min={10}
                  max={40}
                  value={lineHeightPt}
                  className="h-9 bg-muted/10 text-sm border-border"
                  onChange={e => setLineHeightPt(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="flex items-center gap-6 pt-2">
              <Button
                onClick={handleSave}
                className="h-9 px-6 text-xs font-semibold"
                disabled={isSaving || isDeleting}
              >
                {isSaving ? <Loader2 className="size-3 animate-spin mr-2" /> : null}
                {isSaving ? "Saving…" : "Save template"}
              </Button>
              {prescriptionTemplate && (
                <Button
                  variant="ghost"
                  className="h-9 text-xs font-medium text-muted-foreground/70 hover:text-destructive hover:bg-destructive/5 gap-2"
                  onClick={handleRemove}
                  disabled={isSaving || isDeleting}
                >
                  {isDeleting ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3.5" />}
                  Remove template
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 py-32 border border-dashed border-border rounded-xl bg-muted/10">
            <div className="size-12 rounded-full bg-muted/30 flex items-center justify-center">
              <ImageIcon className="size-6 text-muted-foreground/50" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">No template image</p>
              <p className="text-xs text-muted-foreground mt-1">Start by choosing your clinic&apos;s letterhead image above.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
