"""
Configuration file for SVA Terminal
"""

# Supabase Configuration
SUPABASE_URL = "https://ugkdbfmgunoktnmbchmh.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVna2RiZm1ndW5va3RubWJjaG1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU0NDI3NzQsImV4cCI6MjA0MTAxODc3NH0.Ub7YKLKzNqPNLPPKCNKOQJZhJJOLGPZOLGPZOLGPZOL"

# Hardware Configuration
CAMERA_INDEX = 0  # Default camera index
FINGERPRINT_PORT = '/dev/ttyUSB0'  # USB-TTL converter port
FINGERPRINT_BAUDRATE = 57600

# Display Configuration
SCREEN_WIDTH = 800
SCREEN_HEIGHT = 600
FULLSCREEN = True

# Face Recognition Configuration
FACE_CASCADE_PATH = 'haarcascade_frontalface_default.xml'
FACE_RECOGNITION_TIMEOUT = 10  # seconds
FACE_MATCH_THRESHOLD = 0.6

# Fingerprint Configuration
FINGERPRINT_TIMEOUT = 15  # seconds
MAX_FINGERPRINT_ATTEMPTS = 3

# Application Configuration
AUTO_RESET_DELAY = 5000  # milliseconds
SPLASH_SCREEN_DURATION = 3000  # milliseconds

# Logging Configuration
LOG_LEVEL = 'INFO'
LOG_FILE = 'logs/sva_terminal.log'
MAX_LOG_SIZE = 10 * 1024 * 1024  # 10MB
LOG_BACKUP_COUNT = 5

# Network Configuration
CONNECTION_TIMEOUT = 30  # seconds
RETRY_ATTEMPTS = 3
RETRY_DELAY = 5  # seconds

# Security Configuration
SESSION_TIMEOUT = 300  # 5 minutes of inactivity
ADMIN_PASSWORD = "admin123"  # Change in production

# File Paths
ASSETS_DIR = "assets"
TEMP_DIR = "/tmp/sva_terminal"
STUDENT_PHOTOS_DIR = "student_photos"

