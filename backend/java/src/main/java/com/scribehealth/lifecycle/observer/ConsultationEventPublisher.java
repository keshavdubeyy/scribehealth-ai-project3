package com.scribehealth.lifecycle.observer;

import java.util.ArrayList;
import java.util.List;

public class ConsultationEventPublisher {

    private final List<ConsultationObserver> observers = new ArrayList<>();

    public void subscribe(ConsultationObserver observer) {
        observers.add(observer);
    }

    public void unsubscribe(ConsultationObserver observer) {
        observers.remove(observer);
    }

    public void publish(ConsultationEvent event) {
        for (ConsultationObserver observer : observers) {
            observer.onEvent(event);
        }
    }
}
