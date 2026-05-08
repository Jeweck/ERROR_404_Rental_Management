# Rental Management System - Login Page

A modern, responsive login page for your Rental Management System.

## Project Structure

```
.
├── index.html          # Main login page
├── register.html       # Registration page
├── styles.css          # Styling for the login page
├── script.js           # JavaScript functionality
└── README.md          # This file
```

## Features

✅ **Responsive Design** - Works on desktop, tablet, and mobile devices
✅ **Email & Password Fields** - With proper validation
✅ **Remember Me** - Saves email to localStorage for convenience
✅ **Login & Register Buttons** - Professional styling
✅ **Form Validation** - Client-side validation for email and password
✅ **Smooth Animations** - Hover effects and transitions
✅ **Modern UI** - Clean, professional design matching your mockup

## How to Use

1. **Open the login page:**
   - Simply open `index.html` in your web browser
   - Or serve it using a local server:
     ```bash
     python -m http.server 8000
     # Then visit http://localhost:8000
     ```

2. **Login:**
   - Enter your email address
   - Enter your password
   - Optionally check "Remember me" to save your email
   - Click "Login"

3. **Register:**
   - Click the "Register" button to go to the registration page
   - Fill in your details and create an account

## Customization

### Colors
Edit the colors in `styles.css`:
- Blue buttons: `#2980b9`
- Green buttons: `#27ae60`
- Sidebar background: `#1a3a52` to `#2c5282` (gradient)

### Backend Integration
In `script.js`, replace the alert and console.log with your actual API call:
```javascript
// Replace this:
alert('Login successful!');

// With your actual backend API:
fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
})
.then(response => response.json())
.then(data => {
    if (data.success) {
        window.location.href = '/dashboard';
    }
});
```

## Browser Compatibility

- Chrome/Chromium
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome Mobile)

## Files Included

- **index.html** - Main login page with form
- **register.html** - Registration page
- **styles.css** - All styling (responsive)
- **script.js** - Form handling and validation

## Features Detail

### Login Page
- Email validation
- Password field with secure input
- Remember me checkbox
- Login button (blue)
- Link to registration page
- Professional sidebar with branding

### Register Page
- Full name input
- Email input
- Password with confirmation
- Back to login link

## Notes

- The "Remember me" feature uses localStorage (client-side only)
- Currently shows alerts for success/errors - connect to your backend API
- All form validation is client-side - add server-side validation for production
- Fully responsive - mobile, tablet, and desktop friendly

Enjoy your new login page! 🎉
