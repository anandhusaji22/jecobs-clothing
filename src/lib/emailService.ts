import nodemailer from 'nodemailer';
export const runtime = 'nodejs';

// Create reusable transporter object
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

interface OrderEmailData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  orderNumber: string;
  productName: string;
  productImage: string;
  quantity: number;
  totalPrice: number;
  deliveryDates: string[];
  orderDate: string;
  status: string;
}

export async function sendOrderConfirmationEmail(orderData: OrderEmailData) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: orderData.customerEmail,
    subject: `Order Confirmation - ${orderData.orderNumber}`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; }
          .header { background-color: #000; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .order-details { background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .product-info { display: flex; align-items: center; margin: 15px 0; }
          .product-image { width: 80px; height: 80px; object-fit: cover; border-radius: 8px; margin-right: 15px; }
          .footer { background-color: #f0f0f0; padding: 20px; text-align: center; color: #666; }
          .status-badge { background-color: #4CAF50; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Confirmation</h1>
            <p>Thank you for your order!</p>
          </div>
          
          <div class="content">
            <h2>Hello ${orderData.customerName},</h2>
            <p>We're excited to confirm that we've received your order and we're preparing it for you.</p>
            
            <div class="order-details">
              <h3>Order Details</h3>
              <p><strong>Order Number:</strong> ${orderData.orderNumber}</p>
              <p><strong>Order Date:</strong> ${orderData.orderDate}</p>
              <p><strong>Status:</strong> <span class="status-badge">${orderData.status}</span></p>
            </div>
            
            <div class="product-info">
              <img src="${orderData.productImage}" alt="${orderData.productName}" class="product-image" />
              <div>
                <h3>${orderData.productName}</h3>
                <p><strong>Quantity:</strong> ${orderData.quantity}</p>
                <p><strong>Total Price:</strong> ₹${orderData.totalPrice}</p>
              </div>
            </div>
            
            <div class="order-details">
              <h3>Delivery Information</h3>
              <p><strong>Expected Completion Dates:</strong></p>
              <ul>
                ${orderData.deliveryDates.map(date => `<li>${date}</li>`).join('')}
              </ul>
              <p>Products will be shipped on the selected completion dates as per our shipping policy.</p>
            </div>
            
            <div class="order-details">
              <h3>Contact Information</h3>
              <p><strong>Phone:</strong> ${orderData.customerPhone}</p>
              <p><strong>Email:</strong> ${orderData.customerEmail}</p>
            </div>
            
            <p>We'll keep you updated on your order status. If you have any questions, please don't hesitate to contact us.</p>
          </div>
          
          <div class="footer">
            <p>&copy; 2025 Jacob's Clothing. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Order confirmation email sent successfully');
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    throw error;
  }
}

export async function sendOrderStatusUpdateEmail(orderData: OrderEmailData) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: orderData.customerEmail,
    subject: `Order Status Update - ${orderData.orderNumber}`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Status Update</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; }
          .header { background-color: #000; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .status-update { background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #2196F3; }
          .footer { background-color: #f0f0f0; padding: 20px; text-align: center; color: #666; }
          .status-badge { background-color: #4CAF50; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Status Update</h1>
          </div>
          
          <div class="content">
            <h2>Hello ${orderData.customerName},</h2>
            <p>We have an update on your order status.</p>
            
            <div class="status-update">
              <h3>Order ${orderData.orderNumber}</h3>
              <p><strong>Product:</strong> ${orderData.productName}</p>
              <p><strong>New Status:</strong> <span class="status-badge">${orderData.status}</span></p>
            </div>
            
            <p>Thank you for choosing Jacob's Clothing!</p>
          </div>
          
          <div class="footer">
            <p>&copy; 2025 Jacob's Clothing. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Order status update email sent successfully');
  } catch (error) {
    console.error('Error sending order status update email:', error);
    throw error;
  }
}