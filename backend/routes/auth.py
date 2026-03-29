import secrets
import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from db import get_db
from functools import wraps

auth_bp = Blueprint('auth', __name__)

def require_user(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'message': 'Unauthorized'}), 401
        
        token = auth_header.split(' ')[1]
        db = get_db()
        session = db.sessions.find_one({'token': token})
        
        if not session:
            return jsonify({'success': False, 'message': 'Unauthorized'}), 401
        
        request.user_id = session.get('user_id')
        request.user_role = session.get('role')
        return f(*args, **kwargs)
    return decorated

def require_admin(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'message': 'Unauthorized - Missing token'}), 401
        
        token = auth_header.split(' ')[1]
        db = get_db()
        session = db.sessions.find_one({'token': token})
        
        if not session:
            return jsonify({'success': False, 'message': 'Unauthorized - Invalid or expired session'}), 401
            
        if session.get('role') != 'admin':
            return jsonify({'success': False, 'message': 'Forbidden - Admin access required'}), 403
            
        request.user_id = session.get('user_id')
        request.user_role = session.get('role')
        return f(*args, **kwargs)
    return decorated

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'success': False, 'message': 'Missing credentials'}), 400
        
    db = get_db()
    user = db.users.find_one({'username': data['username']})
    
    if user and check_password_hash(user['password_hash'], data['password']):
        token = secrets.token_hex(32)
        db.sessions.insert_one({
            'token': token,
            'user_id': user['_id'],
            'role': user.get('role', 'user'),
            'created_at': datetime.utcnow()
        })
        return jsonify({
            'success': True, 
            'token': token,
            'role': user.get('role', 'user')
        })
        
    return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'success': False, 'message': 'Missing fields'}), 400
        
    db = get_db()
    if db.users.find_one({'username': data['username']}):
        return jsonify({'success': False, 'message': 'Username already exists'}), 400
        
    user_id = str(uuid.uuid4())
    db.users.insert_one({
        '_id': user_id,
        'username': data['username'],
        'password_hash': generate_password_hash(data['password']),
        'role': 'user',
        'created_at': datetime.utcnow()
    })
    
    return jsonify({'success': True, 'message': 'User registered successfully'})

@auth_bp.route('/profile', methods=['GET'])
@require_user
def profile():
    db = get_db()
    user = db.users.find_one({'_id': request.user_id})
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404
        
    return jsonify({
        'success': True,
        'username': user['username'],
        'role': user.get('role', 'user'),
        'created_at': user['created_at'].isoformat() if isinstance(user['created_at'], datetime) else user['created_at']
    })

@auth_bp.route('/history', methods=['GET'])
@require_user
def history():
    db = get_db()
    cursor = db.prediction_history.find({'user_id': request.user_id}).sort('created_at', -1)
    history_list = []
    for doc in cursor:
        history_list.append({
            'id': str(doc['_id']),
            'image_path': doc.get('image_path'),
            'predicted_label': doc.get('predicted_label'),
            'confidence': doc.get('confidence'),
            'created_at': doc.get('created_at').isoformat() if isinstance(doc.get('created_at'), datetime) else doc.get('created_at')
        })
    return jsonify({'success': True, 'history': history_list})
