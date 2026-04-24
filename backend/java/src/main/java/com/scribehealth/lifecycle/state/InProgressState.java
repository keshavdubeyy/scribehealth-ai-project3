package com.scribehealth.lifecycle.state;

public class InProgressState implements ConsultationState {
    @Override
    public String statusName() { return "IN_PROGRESS"; }

    @Override
    public ConsultationState transitionTo(String targetStatus) {
        if ("RECORDED".equals(targetStatus)) return new RecordedState();
        throw new IllegalStateTransitionException(statusName(), targetStatus);
    }
}
