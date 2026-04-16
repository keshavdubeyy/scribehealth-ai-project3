"use client"

import * as React from "react"
import { useScribeStore } from "@/lib/mock-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Upload, Trash2, CheckCircle, Move, Loader2, Image as ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export default function PrescriptionTemplatePage() {
  const { prescriptionTemplate, savePrescriptionTemplate, deletePrescriptionTemplate } = useScribeStore()
  
  const [mounted, setMounted] = React.useState(false)
  const [imageUrl, setImageUrl] = React.useState<string>("")
  const [safeZone, setSafeZone] = React.useState({ x: 0, y: 0, width: 0, height: 0 })
  const [fontSize, setFontSize] = React.useState(20)
  const [lineHeight, setLineHeight] = React.useState(32)
  
  const [isDrawing, setIsDrawing] = React.useState(false)
  const [startPos, setStartPos] = React.useState({ x: 0, y: 0 })
  const [isSaving, setIsSaving] = React.useState(false)
  
  const containerRef = React.useRef<HTMLDivElement>(null)
  const imageRef = React.useRef<HTMLImageElement>(null)

  // Initialize from store
  React.useEffect(() => {
    setMounted(true)
    if (prescriptionTemplate) {
      setImageUrl(prescriptionTemplate.imageUrl)
      setSafeZone(prescriptionTemplate.safeZone)
      setFontSize(prescriptionTemplate.fontSize)
      setLineHeight(prescriptionTemplate.lineHeight)
    }
  }, [prescriptionTemplate])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast.error("Please upload a JPG or PNG image.")
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setImageUrl(event.target?.result as string)
      // Reset safe zone for new image
      setSafeZone({ x: 0, y: 0, width: 0, height: 0 })
      toast.success("Image uploaded.")
    }
    reader.readAsDataURL(file)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!imageUrl || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setStartPos({ x, y })
    setSafeZone({ x, y, width: 0, height: 0 })
    setIsDrawing(true)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const currentX = e.clientX - rect.left
    const currentY = e.clientY - rect.top
    
    setSafeZone({
      x: Math.min(startPos.x, currentX),
      y: Math.min(startPos.y, currentY),
      width: Math.abs(currentX - startPos.x),
      height: Math.abs(currentY - startPos.y)
    })
  }

  const handleMouseUp = () => {
    setIsDrawing(false)
  }

  const handleSave = async () => {
    if (!imageUrl) {
      toast.error("Please upload an image first.")
      return
    }
    
    setIsSaving(true)
    try {
      await savePrescriptionTemplate({
        imageUrl,
        safeZone,
        fontSize,
        lineHeight
      })
      toast.success("Template image saved")
    } catch (error) {
      toast.error("Failed to save template.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemove = async () => {
    setImageUrl("")
    setSafeZone({ x: 0, y: 0, width: 0, height: 0 })
    await deletePrescriptionTemplate()
    toast.success("Template removed.")
  }

  if (!mounted) return null

  return (
    <div className="flex flex-col gap-10 w-full animate-in fade-in duration-500 max-w-4xl">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-bold text-foreground">Prescription template</h1>
        <p className="text-[13px] text-muted-foreground leading-relaxed max-w-2xl">
          Upload your clinic letterhead and mark where text should be placed. This template will be used for all prescriptions you generate.
        </p>
      </div>

      <div className="grid gap-12">
        {/* Upload Section */}
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-foreground">Prescription pad image</h2>
            <p className="text-xs text-muted-foreground">
              Upload a JPG or PNG scan of your letterhead. The image will be used as the PDF background.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="secondary" className="gap-2 h-9 text-xs font-medium bg-muted/50 border border-border" asChild>
              <label className="cursor-pointer">
                <Upload className="size-3.5" />
                Choose image...
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/jpeg,image/png" 
                  onChange={handleImageUpload} 
                />
              </label>
            </Button>
            {imageUrl && (
              <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold">
                <CheckCircle className="size-3.5" />
                Template image saved
              </div>
            )}
          </div>
        </div>

        {/* Editor Section */}
        {imageUrl ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Move className="size-3.5 text-muted-foreground" />
                Draw the safe writing area
              </div>
              <p className="text-xs text-muted-foreground">
                Click and drag on the image to mark the area where the prescription text should be written.
              </p>
            </div>

            <div className="p-1 sm:p-4 bg-muted/20 border border-border rounded-xl flex justify-center overflow-hidden">
               <div 
                ref={containerRef}
                className="relative border border-border shadow-sm rounded-md overflow-hidden bg-white select-none cursor-crosshair"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ width: 'fit-content', maxWidth: '100%' }}
              >
                <img 
                  ref={imageRef}
                  src={imageUrl} 
                  alt="Letterhead" 
                  className="max-w-full h-auto block" 
                  draggable={false}
                />
                
                {/* Safe Zone Rectangle */}
                <div 
                   className="absolute border-[1.5px] border-dashed border-primary bg-primary/10 flex items-start justify-start p-1"
                   style={{
                     left: safeZone.x,
                     top: safeZone.y,
                     width: safeZone.width,
                     height: safeZone.height,
                     display: safeZone.width > 2 ? 'flex' : 'none',
                     pointerEvents: 'none'
                   }}
                 >
                   <span className="text-[9px] font-bold text-primary bg-white/80 px-1 rounded absolute top-0 left-0">
                     Safe zone
                   </span>
                 </div>
              </div>
            </div>
            
            <div className="text-[11px] text-muted-foreground/80">
               Safe zone: {Math.round(safeZone.width)} × {Math.round(safeZone.height)} px at ({Math.round(safeZone.x)}, {Math.round(safeZone.y)})
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-[320px]">
              <div className="space-y-2">
                <Label htmlFor="fontSize" className="text-xs font-semibold">Font size (pt)</Label>
                <Input 
                  id="fontSize" 
                  type="number" 
                  min={7} 
                  max={16} 
                  value={fontSize} 
                  className="h-9 bg-muted/10 text-sm border-border"
                  onChange={(e) => setFontSize(Number(e.target.value))} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lineHeight" className="text-xs font-semibold">Line height (pt)</Label>
                <Input 
                  id="lineHeight" 
                  type="number" 
                  min={10} 
                  max={40} 
                  value={lineHeight} 
                  className="h-9 bg-muted/10 text-sm border-border"
                  onChange={(e) => setLineHeight(Number(e.target.value))} 
                />
              </div>
            </div>

            <div className="flex items-center gap-6 pt-2">
              <Button 
                onClick={handleSave} 
                className="h-9 px-6 text-xs font-semibold bg-[#205060] hover:bg-[#1a4452] text-white rounded-md shadow-sm" 
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="size-3 animate-spin mr-2" /> : null}
                Update template
              </Button>
              <Button 
                variant="ghost" 
                className="h-9 text-xs font-medium text-muted-foreground/70 hover:text-destructive hover:bg-destructive/5 gap-2" 
                onClick={handleRemove}
              >
                <Trash2 className="size-3.5" />
                Remove template
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 py-32 border border-dashed border-border rounded-xl bg-muted/10">
            <div className="size-12 rounded-full bg-muted/30 flex items-center justify-center">
              <ImageIcon className="size-6 text-muted-foreground/50" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">No template image</p>
              <p className="text-xs text-muted-foreground mt-1">Start by choosing your clinic's letterhead image above.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
