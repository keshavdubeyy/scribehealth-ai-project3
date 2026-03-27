package com.scribehealth.service;

import com.scribehealth.model.*;
import com.scribehealth.repository.*;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class ConsultationService {
    private final SessionRepository sessionRepository;
    private final TranscriptionRepository transcriptionRepository;
    private final ClinicalNoteRepository noteRepository;
    private final PrescriptionRepository prescriptionRepository;

    public ConsultationService(SessionRepository sessionRepository, 
                               TranscriptionRepository transcriptionRepository,
                               ClinicalNoteRepository noteRepository,
                               PrescriptionRepository prescriptionRepository) {
        this.sessionRepository = sessionRepository;
        this.transcriptionRepository = transcriptionRepository;
        this.noteRepository = noteRepository;
        this.prescriptionRepository = prescriptionRepository;
    }

    // Sessions
    public List<ConsultationSession> getSessionsByPatient(String patientId) {
        return sessionRepository.findByPatientId(patientId);
    }

    public ConsultationSession createSession(String patientId) {
        ConsultationSession s = new ConsultationSession();
        s.setPatientId(patientId);
        s.setStatus(SessionStatus.IDLE);
        return sessionRepository.save(s);
    }

    public ConsultationSession updateSessionStatus(String id, SessionStatus status) {
        ConsultationSession s = sessionRepository.findById(id).orElseThrow();
        s.setStatus(status);
        return sessionRepository.save(s);
    }

    // Transcription
    public Transcription saveTranscription(Transcription transcription) {
        ConsultationSession s = sessionRepository.findById(transcription.getSessionId()).orElseThrow();
        s.setStatus(SessionStatus.PROCESSING);
        sessionRepository.save(s);
        return transcriptionRepository.save(transcription);
    }

    public Optional<Transcription> getTranscription(String sessionId) {
        return transcriptionRepository.findBySessionId(sessionId);
    }

    // Note (SOAP)
    public ClinicalNote saveNote(ClinicalNote note) {
        ConsultationSession s = sessionRepository.findById(note.getSessionId()).orElseThrow();
        s.setStatus(SessionStatus.COMPLETED);
        sessionRepository.save(s);
        return noteRepository.save(note);
    }

    public Optional<ClinicalNote> getNote(String sessionId) {
        return noteRepository.findBySessionId(sessionId);
    }

    // Prescriptions
    public Prescription addPrescription(Prescription p) {
        return prescriptionRepository.save(p);
    }

    public List<Prescription> getPrescriptions(String sessionId) {
        return prescriptionRepository.findBySessionId(sessionId);
    }

    public void removePrescription(String id) {
        prescriptionRepository.deleteById(id);
    }
}
