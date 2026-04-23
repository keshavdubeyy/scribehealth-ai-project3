package com.scribehealth.lifecycle.state;

public interface ConsultationState {
    String statusName();
    ConsultationState transitionTo(String targetStatus);
}
