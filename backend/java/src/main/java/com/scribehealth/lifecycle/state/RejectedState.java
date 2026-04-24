package com.scribehealth.lifecycle.state;

public class RejectedState implements ConsultationState {
    @Override
    public String statusName() { return "REJECTED"; }

    @Override
    public ConsultationState transitionTo(String targetStatus) {
        if ("UNDER_REVIEW".equals(targetStatus)) return new UnderReviewState();
        throw new IllegalStateTransitionException(statusName(), targetStatus);
    }
}
