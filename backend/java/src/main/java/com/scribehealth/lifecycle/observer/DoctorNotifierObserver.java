package com.scribehealth.lifecycle.observer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class DoctorNotifierObserver implements ConsultationObserver {

    private static final Logger log = LoggerFactory.getLogger(DoctorNotifierObserver.class);

    @Override
    public void onEvent(ConsultationEvent event) {
        switch (event.getToStatus()) {
            case "UNDER_REVIEW" ->
                log.info("[NOTIFY] Note ready for review — session={} doctor={}",
                        event.getSessionId(), event.getDoctorEmail());
            case "APPROVED" ->
                log.info("[NOTIFY] Note approved and locked — session={} doctor={}",
                        event.getSessionId(), event.getDoctorEmail());
            case "REJECTED" ->
                log.info("[NOTIFY] Note rejected, awaiting regeneration — session={} doctor={}",
                        event.getSessionId(), event.getDoctorEmail());
        }
    }
}
