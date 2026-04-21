package com.scribehealth.config;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Handles PostgreSQL jsonb ↔ Java String conversion without a compile-time
 * dependency on org.postgresql.util.PGobject (which is runtime-scoped).
 */
@Converter
public class JsonbConverter implements AttributeConverter<String, Object> {

    @Override
    public Object convertToDatabaseColumn(String attribute) {
        try {
            Class<?> pgObjectClass = Class.forName("org.postgresql.util.PGobject");
            Object pgObject = pgObjectClass.getDeclaredConstructor().newInstance();
            pgObjectClass.getMethod("setType", String.class).invoke(pgObject, "jsonb");
            pgObjectClass.getMethod("setValue", String.class)
                    .invoke(pgObject, attribute != null ? attribute : "{}");
            return pgObject;
        } catch (Exception e) {
            return attribute != null ? attribute : "{}";
        }
    }

    @Override
    public String convertToEntityAttribute(Object dbData) {
        if (dbData == null) return "{}";
        return dbData.toString();
    }
}
