package com.example.demo.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {
    @Autowired
    private JavaMailSender mailSender;

    public void sendPriceAlertEmail(String to, String gpuModel, Integer price, Integer threshold, String redditUrl) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Price Alert: " + gpuModel + " below your threshold!");
        message.setText(String.format(
            "A %s has been listed for $%d, which is below your threshold of $%d!\n\n" +
            "Check it out here: %s",
            gpuModel, price, threshold, redditUrl
        ));
        
        mailSender.send(message);
    }
} 