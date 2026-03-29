import nodemailer from "nodemailer";
import { db, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

export async function getEmailTransporter() {
  const [settings] = await db
    .select()
    .from(settingsTable)
    .where(eq(settingsTable.id, "default"));

  if (!settings || !settings.smtpHost || !settings.smtpPort) {
    logger.warn("SMTP settings not fully configured. Email skipped.");
    return null;
  }

  return nodemailer.createTransport({
    host: settings.smtpHost,
    port: settings.smtpPort,
    secure: settings.smtpPort === 465,
    auth: settings.smtpUser && settings.smtpPassword ? {
      user: settings.smtpUser,
      pass: settings.smtpPassword,
    } : undefined,
  });
}

export async function sendInventoryAlert(ingredientName: string, currentStock: number, unit: string) {
  const [settings] = await db
    .select()
    .from(settingsTable)
    .where(eq(settingsTable.id, "default"));

  if (!settings || !settings.inventoryAlertEmail || !settings.smtpFromEmail) {
    return;
  }

  const transporter = await getEmailTransporter();
  if (!transporter) return;

  const subject = `Low Stock Alert: ${ingredientName}`;
  const text = `The ingredient "${ingredientName}" is running low. Current stock: ${currentStock} ${unit}.`;
  
  try {
    await transporter.sendMail({
      from: settings.smtpFromEmail,
      to: settings.inventoryAlertEmail,
      subject,
      text,
    });
    logger.info({ ingredientName }, "Inventory alert email sent");
  } catch (err) {
    logger.error({ err }, "Failed to send inventory alert email");
  }
}

export async function sendShiftReport(shiftId: string, recipientEmail: string, reportData: any) {
  const [settings] = await db
    .select()
    .from(settingsTable)
    .where(eq(settingsTable.id, "default"));

  if (!settings || !settings.smtpFromEmail) {
    return;
  }

  const transporter = await getEmailTransporter();
  if (!transporter) return;

  const subject = `Shift Report - ${new Date().toLocaleDateString()}`;
  const text = `Shift ${shiftId} has been closed. 
  
Total Sales: ${reportData.cashSalesMxn + reportData.cardSalesMxn} MXN
Cash: ${reportData.cashSalesMxn} MXN
Card: ${reportData.cardSalesMxn} MXN

Check the admin portal for full details.`;

  try {
    await transporter.sendMail({
      from: settings.smtpFromEmail,
      to: recipientEmail,
      subject,
      text,
    });
    logger.info({ shiftId }, "Shift report email sent");
  } catch (err) {
    logger.error({ err }, "Failed to send shift report email");
  }
}
