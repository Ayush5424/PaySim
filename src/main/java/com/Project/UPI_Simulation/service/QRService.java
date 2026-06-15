package com.Project.UPI_Simulation.service;

import com.Project.UPI_Simulation.entity.User;
import com.Project.UPI_Simulation.repository.UserRepository;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import javax.print.DocFlavor;
import java.io.ByteArrayOutputStream;
import java.io.OutputStream;

@Service
@RequiredArgsConstructor
public class QRService {

    private final UserRepository userRepo;

    public byte[] generateUserQR(String upiId){
        try{
            User user = userRepo.findByUpiId(upiId).orElseThrow(() -> new RuntimeException("User not found"));

            String qrData = "upi://pay?pa=" + user.getUpiId() + "&pn=" + user.getName() + "&cu=INR";

            QRCodeWriter qrCodeWriter = new QRCodeWriter();

            BitMatrix bitMatrix = qrCodeWriter.encode(qrData, BarcodeFormat.QR_CODE, 300, 300);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

            MatrixToImageWriter.writeToStream(bitMatrix,"PNG", OutputStream.nullOutputStream());

            return outputStream.toByteArray();
        }

        catch (Exception e){
            throw new RuntimeException("QR generation failed");
        }

    }


}
