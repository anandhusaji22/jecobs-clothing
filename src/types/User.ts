


export interface UserRegisterData {
    name: string;
    email: string;
    password?: string;
    phoneNumber?: string;
    authProvider: 'email' | 'google' | 'phone' | 'firebase';
    firebaseUid: string;
    googleId?: string;
    isPhoneVerified?: boolean;
    role: 'customer' | 'admin';
    avatar?: string;
    denomination: string; // for denomination designation, e.g., 'Orthodox & Jacobite', 'Mar Thoma', 'CSI'
    
}


export interface UserLoginData {
    email?: string;
    password?: string;
    phoneNumber?: string;
    otp?: string;
    authProvider: 'email' | 'google' | 'phone' | 'firebase';
}