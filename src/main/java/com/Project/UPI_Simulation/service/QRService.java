package com.Project.UPI_Simulation.service;

import com.Project.UPI_Simulation.dto.QrPayloadResponse;
import com.Project.UPI_Simulation.entity.User;
import com.Project.UPI_Simulation.repository.UserRepository;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
public class QRService {

    private final UserRepository userRepo;

    public byte[] generateUserQR(String upiId){
        try{
            User user = userRepo.findByUpiId(upiId).orElseThrow(() -> new RuntimeException("User not found"));

            String qrData = buildPayload(user);

            QRCodeWriter qrCodeWriter = new QRCodeWriter();

            BitMatrix bitMatrix = qrCodeWriter.encode(qrData, BarcodeFormat.QR_CODE, 300, 300);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

            MatrixToImageWriter.writeToStream(bitMatrix,"PNG", outputStream);

            return outputStream.toByteArray();
        }

        catch (Exception e){
            throw new RuntimeException("QR generation failed");
        }

    }

    public String getUserQrPayload(String upiId) {
        User user = userRepo.findByUpiId(upiId).orElseThrow(() -> new RuntimeException("User not found"));
        return buildPayload(user);
    }

    public QrPayloadResponse getUserQrDetails(String upiId) {
        User user = userRepo.findByUpiId(upiId).orElseThrow(() -> new RuntimeException("User not found"));
        String name = getQrName(user);
        return new QrPayloadResponse(user.getUpiId(), name, buildPayload(user));
    }

    private String buildPayload(User user) {
        String name = getQrName(user);

        return "upi://pay?pa=" + encode(user.getUpiId())
                + "&pn=" + encode(name)
                + "&cu=INR";
    }

    private String getQrName(User user) {
        if (user.getDisplayName() != null && !user.getDisplayName().isBlank()) {
            return user.getDisplayName();
        }
        if (user.getName() != null && !user.getName().isBlank()) {
            return user.getName();
        }
        return user.getUpiId().split("@")[0];
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

}
