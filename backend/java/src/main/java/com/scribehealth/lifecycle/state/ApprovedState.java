package com.scribehealth.lifecycle.state;

public class ApprovedState implements ConsultationState {
    @Override
    public String statusName() { return "APPROVED"; }

    @Override
    public ConsultationState transitionTo(String targetStatus) {
        throw new IllegalStateTransitionException(statusName(), targetStatus);
    }
}
