#!/usr/bin/env python3
"""
Student Verification Assistant (SVA) Terminal
Raspberry Pi Kiosk Application

This application runs on a Raspberry Pi with:
- TFT LCD Touchscreen
- Camera Module
- USB Fingerprint Scanner

Features:
- Face Recognition using OpenCV
- Fingerprint Authentication
- Real-time attendance logging to Supabase
- Kiosk mode interface
"""

import sys
import os
import cv2
import numpy as np
import time
import base64
from datetime import datetime
from PyQt5.QtWidgets import (QApplication, QMainWindow, QWidget, QVBoxLayout, 
                             QHBoxLayout, QLabel, QPushButton, QComboBox, 
                             QStackedWidget, QFrame, QMessageBox, QProgressBar)
from PyQt5.QtCore import Qt, QTimer, QThread, pyqtSignal, QSize
from PyQt5.QtGui import QFont, QPixmap, QImage, QPalette, QColor
from supabase import create_client, Client
try:
    from PyFingerprint import PyFingerprint
except ImportError:
    # Mock PyFingerprint for development/testing
    class PyFingerprint:
        def __init__(self, *args, **kwargs):
            pass

# Supabase configuration
SUPABASE_URL = "https://ugkdbfmgunoktnmbchmh.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVna2RiZm1ndW5va3RubWJjaG1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU0NDI3NzQsImV4cCI6MjA0MTAxODc3NH0.Ub7YKLKzNqPNLPPKCNKOQJZhJJOLGPZOLGPZOLGPZOL"

class FaceRecognitionThread(QThread):
    """Thread for face recognition processing"""
    face_detected = pyqtSignal(bool, str)  # success, message
    
    def __init__(self, reference_image_path):
        super().__init__()
        self.reference_image_path = reference_image_path
        self.running = False
        
    def run(self):
        self.running = True
        try:
            # Initialize camera
            cap = cv2.VideoCapture(0)
            if not cap.isOpened():
                self.face_detected.emit(False, "Camera not available")
                return
                
            # Load face cascade classifier
            face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
            
            # Load reference image
            if os.path.exists(self.reference_image_path):
                reference_img = cv2.imread(self.reference_image_path)
                reference_gray = cv2.cvtColor(reference_img, cv2.COLOR_BGR2GRAY)
            else:
                self.face_detected.emit(False, "Reference image not found")
                return
            
            start_time = time.time()
            timeout = 10  # 10 seconds timeout
            
            while self.running and (time.time() - start_time) < timeout:
                ret, frame = cap.read()
                if not ret:
                    continue
                    
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                faces = face_cascade.detectMultiScale(gray, 1.1, 4)
                
                if len(faces) > 0:
                    # Simple face matching (in production, use more sophisticated methods)
                    # For demo purposes, we'll assume face is matched if detected
                    self.face_detected.emit(True, "Face recognized successfully")
                    break
                    
                time.sleep(0.1)
            
            if self.running:
                self.face_detected.emit(False, "Face recognition timeout")
                
            cap.release()
            
        except Exception as e:
            self.face_detected.emit(False, f"Face recognition error: {str(e)}")
    
    def stop(self):
        self.running = False

class FingerprintThread(QThread):
    """Thread for fingerprint authentication"""
    fingerprint_verified = pyqtSignal(bool, str)  # success, message
    
    def __init__(self, reference_template):
        super().__init__()
        self.reference_template = reference_template
        self.running = False
        
    def run(self):
        self.running = True
        try:
            # Initialize fingerprint sensor (mock for development)
            # In production, use actual PyFingerprint library
            
            # Simulate fingerprint scanning
            time.sleep(3)  # Simulate scanning time
            
            if self.running:
                # For demo purposes, randomly succeed/fail
                import random
                success = random.choice([True, True, False])  # 66% success rate
                
                if success:
                    self.fingerprint_verified.emit(True, "Fingerprint verified successfully")
                else:
                    self.fingerprint_verified.emit(False, "Fingerprint verification failed")
                    
        except Exception as e:
            self.fingerprint_verified.emit(False, f"Fingerprint error: {str(e)}")
    
    def stop(self):
        self.running = False

class SplashScreen(QWidget):
    """Splash screen with SVA logo"""
    
    def __init__(self):
        super().__init__()
        self.init_ui()
        
    def init_ui(self):
        layout = QVBoxLayout()
        layout.setAlignment(Qt.AlignCenter)
        
        # Logo/Title
        title = QLabel("SVA Terminal")
        title.setAlignment(Qt.AlignCenter)
        title.setFont(QFont("Arial", 48, QFont.Bold))
        title.setStyleSheet("color: #2563eb; margin: 20px;")
        
        subtitle = QLabel("Student Verification Assistant")
        subtitle.setAlignment(Qt.AlignCenter)
        subtitle.setFont(QFont("Arial", 24))
        subtitle.setStyleSheet("color: #64748b; margin: 10px;")
        
        # Loading indicator
        self.progress = QProgressBar()
        self.progress.setRange(0, 0)  # Indeterminate progress
        self.progress.setStyleSheet("""
            QProgressBar {
                border: 2px solid #e2e8f0;
                border-radius: 5px;
                text-align: center;
                font-size: 14px;
            }
            QProgressBar::chunk {
                background-color: #2563eb;
                border-radius: 3px;
            }
        """)
        
        layout.addWidget(title)
        layout.addWidget(subtitle)
        layout.addWidget(self.progress)
        
        self.setLayout(layout)

class ExamSelectionScreen(QWidget):
    """Screen for admin to select exam"""
    exam_selected = pyqtSignal(dict)  # exam data
    
    def __init__(self, supabase_client):
        super().__init__()
        self.supabase = supabase_client
        self.init_ui()
        self.load_exams()
        
    def init_ui(self):
        layout = QVBoxLayout()
        layout.setSpacing(20)
        layout.setContentsMargins(50, 50, 50, 50)
        
        # Title
        title = QLabel("Select Examination")
        title.setAlignment(Qt.AlignCenter)
        title.setFont(QFont("Arial", 32, QFont.Bold))
        title.setStyleSheet("color: #1e293b; margin-bottom: 30px;")
        
        # Instructions
        instructions = QLabel("Please select the examination session for student verification")
        instructions.setAlignment(Qt.AlignCenter)
        instructions.setFont(QFont("Arial", 16))
        instructions.setStyleSheet("color: #64748b; margin-bottom: 20px;")
        
        # Exam selection
        self.exam_combo = QComboBox()
        self.exam_combo.setFont(QFont("Arial", 14))
        self.exam_combo.setMinimumHeight(50)
        self.exam_combo.setStyleSheet("""
            QComboBox {
                border: 2px solid #e2e8f0;
                border-radius: 8px;
                padding: 10px;
                background-color: white;
            }
            QComboBox:focus {
                border-color: #2563eb;
            }
        """)
        
        # Start button
        self.start_btn = QPushButton("Start Verification Session")
        self.start_btn.setFont(QFont("Arial", 16, QFont.Bold))
        self.start_btn.setMinimumHeight(60)
        self.start_btn.setStyleSheet("""
            QPushButton {
                background-color: #2563eb;
                color: white;
                border: none;
                border-radius: 8px;
                padding: 15px;
            }
            QPushButton:hover {
                background-color: #1d4ed8;
            }
            QPushButton:pressed {
                background-color: #1e40af;
            }
        """)
        self.start_btn.clicked.connect(self.start_verification)
        
        # Refresh button
        refresh_btn = QPushButton("Refresh Exams")
        refresh_btn.setFont(QFont("Arial", 14))
        refresh_btn.setMinimumHeight(50)
        refresh_btn.setStyleSheet("""
            QPushButton {
                background-color: #64748b;
                color: white;
                border: none;
                border-radius: 8px;
                padding: 10px;
            }
            QPushButton:hover {
                background-color: #475569;
            }
        """)
        refresh_btn.clicked.connect(self.load_exams)
        
        layout.addWidget(title)
        layout.addWidget(instructions)
        layout.addWidget(self.exam_combo)
        layout.addWidget(self.start_btn)
        layout.addWidget(refresh_btn)
        layout.addStretch()
        
        self.setLayout(layout)
        
    def load_exams(self):
        """Load available exams from Supabase"""
        try:
            # Get today's exams and future exams
            today = datetime.now().strftime('%Y-%m-%d')
            
            response = self.supabase.table('exams').select("""
                *,
                courses (
                    course_code,
                    course_name
                )
            """).gte('exam_datetime', today).order('exam_datetime').execute()
            
            self.exam_combo.clear()
            self.exams = response.data
            
            for exam in self.exams:
                exam_time = datetime.fromisoformat(exam['exam_datetime'].replace('Z', '+00:00'))
                display_text = f"{exam['courses']['course_code']} - {exam_time.strftime('%Y-%m-%d %H:%M')}"
                self.exam_combo.addItem(display_text)
                
        except Exception as e:
            QMessageBox.warning(self, "Error", f"Failed to load exams: {str(e)}")
    
    def start_verification(self):
        """Start verification session for selected exam"""
        if self.exam_combo.currentIndex() >= 0:
            selected_exam = self.exams[self.exam_combo.currentIndex()]
            self.exam_selected.emit(selected_exam)

class VerificationScreen(QWidget):
    """Main verification screen"""
    verification_complete = pyqtSignal()
    
    def __init__(self, supabase_client, exam_data):
        super().__init__()
        self.supabase = supabase_client
        self.exam_data = exam_data
        self.current_student = None
        self.face_thread = None
        self.fingerprint_thread = None
        self.init_ui()
        
    def init_ui(self):
        layout = QVBoxLayout()
        layout.setSpacing(20)
        layout.setContentsMargins(30, 30, 30, 30)
        
        # Header
        header = QLabel(f"Verification: {self.exam_data['courses']['course_code']}")
        header.setAlignment(Qt.AlignCenter)
        header.setFont(QFont("Arial", 24, QFont.Bold))
        header.setStyleSheet("color: #1e293b; margin-bottom: 20px;")
        
        # Status display
        self.status_label = QLabel("Ready for verification")
        self.status_label.setAlignment(Qt.AlignCenter)
        self.status_label.setFont(QFont("Arial", 18))
        self.status_label.setStyleSheet("color: #2563eb; margin-bottom: 20px;")
        
        # Student info display
        self.student_info = QFrame()
        self.student_info.setStyleSheet("""
            QFrame {
                background-color: #f8fafc;
                border: 2px solid #e2e8f0;
                border-radius: 8px;
                padding: 20px;
            }
        """)
        self.student_info.setVisible(False)
        
        student_layout = QVBoxLayout()
        self.student_name = QLabel()
        self.student_name.setFont(QFont("Arial", 20, QFont.Bold))
        self.student_matric = QLabel()
        self.student_matric.setFont(QFont("Arial", 16))
        self.student_dept = QLabel()
        self.student_dept.setFont(QFont("Arial", 14))
        
        student_layout.addWidget(self.student_name)
        student_layout.addWidget(self.student_matric)
        student_layout.addWidget(self.student_dept)
        self.student_info.setLayout(student_layout)
        
        # Progress indicator
        self.progress_label = QLabel("Step 1: Face Recognition")
        self.progress_label.setAlignment(Qt.AlignCenter)
        self.progress_label.setFont(QFont("Arial", 16))
        self.progress_label.setStyleSheet("color: #64748b;")
        
        # Action buttons
        button_layout = QHBoxLayout()
        
        self.start_btn = QPushButton("Start Verification")
        self.start_btn.setFont(QFont("Arial", 16, QFont.Bold))
        self.start_btn.setMinimumHeight(60)
        self.start_btn.setStyleSheet("""
            QPushButton {
                background-color: #16a34a;
                color: white;
                border: none;
                border-radius: 8px;
                padding: 15px;
            }
            QPushButton:hover {
                background-color: #15803d;
            }
        """)
        self.start_btn.clicked.connect(self.start_face_recognition)
        
        self.reset_btn = QPushButton("Reset")
        self.reset_btn.setFont(QFont("Arial", 14))
        self.reset_btn.setMinimumHeight(60)
        self.reset_btn.setStyleSheet("""
            QPushButton {
                background-color: #64748b;
                color: white;
                border: none;
                border-radius: 8px;
                padding: 15px;
            }
            QPushButton:hover {
                background-color: #475569;
            }
        """)
        self.reset_btn.clicked.connect(self.reset_verification)
        
        self.back_btn = QPushButton("Back to Exam Selection")
        self.back_btn.setFont(QFont("Arial", 14))
        self.back_btn.setMinimumHeight(60)
        self.back_btn.setStyleSheet("""
            QPushButton {
                background-color: #dc2626;
                color: white;
                border: none;
                border-radius: 8px;
                padding: 15px;
            }
            QPushButton:hover {
                background-color: #b91c1c;
            }
        """)
        self.back_btn.clicked.connect(self.verification_complete.emit)
        
        button_layout.addWidget(self.start_btn)
        button_layout.addWidget(self.reset_btn)
        button_layout.addWidget(self.back_btn)
        
        layout.addWidget(header)
        layout.addWidget(self.status_label)
        layout.addWidget(self.student_info)
        layout.addWidget(self.progress_label)
        layout.addWidget(QWidget())  # Spacer
        layout.addLayout(button_layout)
        
        self.setLayout(layout)
        
    def start_face_recognition(self):
        """Start face recognition process"""
        self.status_label.setText("Looking for face...")
        self.status_label.setStyleSheet("color: #f59e0b;")
        self.progress_label.setText("Step 1: Face Recognition - In Progress")
        self.start_btn.setEnabled(False)
        
        # In a real implementation, you would get the reference image from the database
        # For demo purposes, we'll use a placeholder
        reference_image = "/tmp/student_photo.jpg"
        
        self.face_thread = FaceRecognitionThread(reference_image)
        self.face_thread.face_detected.connect(self.on_face_detected)
        self.face_thread.start()
        
    def on_face_detected(self, success, message):
        """Handle face recognition result"""
        if success:
            self.status_label.setText("Face recognized! Showing student details...")
            self.status_label.setStyleSheet("color: #16a34a;")
            self.progress_label.setText("Step 1: Face Recognition - Complete")
            
            # Mock student data (in production, fetch from database based on face recognition)
            self.current_student = {
                'id': 1,
                'name': 'John Doe',
                'matric_number': 'ENG/2021/001',
                'department': 'Computer Engineering',
                'faculty': 'Engineering'
            }
            
            self.show_student_info()
            
            # Auto-proceed to fingerprint after 3 seconds
            QTimer.singleShot(3000, self.start_fingerprint_verification)
            
        else:
            self.status_label.setText(f"Face recognition failed: {message}")
            self.status_label.setStyleSheet("color: #dc2626;")
            self.start_btn.setEnabled(True)
            
    def show_student_info(self):
        """Display student information"""
        if self.current_student:
            self.student_name.setText(f"Name: {self.current_student['name']}")
            self.student_matric.setText(f"Matric No: {self.current_student['matric_number']}")
            self.student_dept.setText(f"Department: {self.current_student['department']}")
            self.student_info.setVisible(True)
            
    def start_fingerprint_verification(self):
        """Start fingerprint verification"""
        self.status_label.setText("Please place finger on scanner...")
        self.status_label.setStyleSheet("color: #f59e0b;")
        self.progress_label.setText("Step 2: Fingerprint Verification - In Progress")
        
        # Mock fingerprint template
        reference_template = b"mock_fingerprint_template"
        
        self.fingerprint_thread = FingerprintThread(reference_template)
        self.fingerprint_thread.fingerprint_verified.connect(self.on_fingerprint_verified)
        self.fingerprint_thread.start()
        
    def on_fingerprint_verified(self, success, message):
        """Handle fingerprint verification result"""
        if success:
            self.status_label.setText("Verification Complete! ✅")
            self.status_label.setStyleSheet("color: #16a34a; font-size: 24px; font-weight: bold;")
            self.progress_label.setText("Step 2: Fingerprint Verification - Complete")
            
            # Log attendance
            self.log_attendance("Verified")
            
            # Auto-reset after 5 seconds
            QTimer.singleShot(5000, self.reset_verification)
            
        else:
            self.status_label.setText(f"Verification Failed! ❌")
            self.status_label.setStyleSheet("color: #dc2626; font-size: 24px; font-weight: bold;")
            
            # Log failed attempt
            self.log_attendance("Failed")
            
            # Auto-reset after 3 seconds
            QTimer.singleShot(3000, self.reset_verification)
            
    def log_attendance(self, status):
        """Log attendance to Supabase"""
        try:
            if self.current_student:
                attendance_data = {
                    'exam_id': self.exam_data['id'],
                    'student_id': self.current_student['id'],
                    'verification_status': status,
                    'timestamp': datetime.now().isoformat()
                }
                
                self.supabase.table('attendance').insert(attendance_data).execute()
                
        except Exception as e:
            print(f"Error logging attendance: {e}")
            
    def reset_verification(self):
        """Reset verification state"""
        self.status_label.setText("Ready for verification")
        self.status_label.setStyleSheet("color: #2563eb; font-size: 18px; font-weight: normal;")
        self.progress_label.setText("Step 1: Face Recognition")
        self.student_info.setVisible(False)
        self.current_student = None
        self.start_btn.setEnabled(True)
        
        # Stop any running threads
        if self.face_thread and self.face_thread.isRunning():
            self.face_thread.stop()
        if self.fingerprint_thread and self.fingerprint_thread.isRunning():
            self.fingerprint_thread.stop()

class SVATerminal(QMainWindow):
    """Main application window"""
    
    def __init__(self):
        super().__init__()
        self.supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        self.init_ui()
        self.show_splash()
        
    def init_ui(self):
        """Initialize the user interface"""
        self.setWindowTitle("SVA Terminal")
        self.setGeometry(0, 0, 800, 600)
        
        # Set up for kiosk mode (fullscreen)
        self.setWindowFlags(Qt.FramelessWindowHint)
        self.showFullScreen()
        
        # Set dark theme
        self.setStyleSheet("""
            QMainWindow {
                background-color: #f8fafc;
            }
        """)
        
        # Create stacked widget for different screens
        self.stacked_widget = QStackedWidget()
        self.setCentralWidget(self.stacked_widget)
        
        # Initialize screens
        self.splash_screen = SplashScreen()
        self.exam_selection_screen = ExamSelectionScreen(self.supabase)
        
        # Connect signals
        self.exam_selection_screen.exam_selected.connect(self.start_verification_session)
        
        # Add screens to stack
        self.stacked_widget.addWidget(self.splash_screen)
        self.stacked_widget.addWidget(self.exam_selection_screen)
        
    def show_splash(self):
        """Show splash screen"""
        self.stacked_widget.setCurrentWidget(self.splash_screen)
        
        # Auto-transition to exam selection after 3 seconds
        QTimer.singleShot(3000, self.show_exam_selection)
        
    def show_exam_selection(self):
        """Show exam selection screen"""
        self.stacked_widget.setCurrentWidget(self.exam_selection_screen)
        
    def start_verification_session(self, exam_data):
        """Start verification session for selected exam"""
        self.verification_screen = VerificationScreen(self.supabase, exam_data)
        self.verification_screen.verification_complete.connect(self.show_exam_selection)
        
        # Add verification screen to stack
        self.stacked_widget.addWidget(self.verification_screen)
        self.stacked_widget.setCurrentWidget(self.verification_screen)
        
    def keyPressEvent(self, event):
        """Handle key press events"""
        # Allow Escape key to exit fullscreen for development
        if event.key() == Qt.Key_Escape:
            self.close()
        super().keyPressEvent(event)

def main():
    """Main application entry point"""
    app = QApplication(sys.argv)
    
    # Set application properties
    app.setApplicationName("SVA Terminal")
    app.setApplicationVersion("1.0")
    
    # Create and show main window
    terminal = SVATerminal()
    terminal.show()
    
    # Run application
    sys.exit(app.exec_())

if __name__ == "__main__":
    main()

