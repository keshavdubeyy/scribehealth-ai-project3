package com.scribehealth.lifecycle.state;

public class RecordedState implements ConsultationState {
    @Override
    public String statusName() { return "RECORDED"; }

    @Override
    public ConsultationState transitionTo(String targetStatus) {
        if ("TRANSCRIBED".equals(targetStatus)) return new TranscribedState();
        throw new IllegalStateTransitionException(statusName(), targetStatus);
    }
}
