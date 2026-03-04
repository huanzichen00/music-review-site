package com.musicreview.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class SecurityAuditService {

    private static final Logger LOG = LoggerFactory.getLogger("SECURITY_AUDIT");

    public void log(String event, String username, String ip, String detail) {
        LOG.info("event={} username={} ip={} detail={}", safe(event), safe(username), safe(ip), safe(detail));
    }

    private String safe(String v) {
        if (v == null || v.isBlank()) {
            return "-";
        }
        return v.trim().replace('\n', '_').replace('\r', '_');
    }
}
