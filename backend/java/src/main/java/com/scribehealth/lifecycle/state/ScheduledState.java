package com.scribehealth.lifecycle.state;

public class ScheduledState implements ConsultationState {
    @Override
    public String statusName() { return "SCHEDULED"; }

    @Override
    public ConsultationState transitionTo(String targetStatus) {
        if ("IN_PROGRESS".equals(targetStatus)) return new InProgressState();
        throw new IllegalStateTransitionException(statusName(), targetStatus);
    }
}
