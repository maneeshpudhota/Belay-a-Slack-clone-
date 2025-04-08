import string
import random
from datetime import datetime
from flask import Flask, g, jsonify
from functools import wraps
from flask import *
import sqlite3

app = Flask(__name__)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0


def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect('database/belay.sqlite3')
        db.row_factory = sqlite3.Row
        setattr(g, '_database', db)
    return db


@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()


def query_db(query, args=(), one=False):
    db = get_db()
    cursor = db.execute(query, args)
    rows = cursor.fetchall()
    db.commit()
    cursor.close()
    if rows:
        if one:
            return rows[0]
        return rows
    return None

@app.route('/')
@app.route('/belay')
@app.route('/login')
@app.route('/signup')
@app.route('/update')
@app.route('/newchannel')
@app.route('/channel/<channel_id>')
@app.route('/channel/<channel_id>/message/<message_id>')
def index(channel_id=None, message_id = None):
    return app.send_static_file('index.html')

def validate_user_api_key(req):
    api_key = req.headers['Api-Key']
    if api_key:
        return query_db('select * from users where api_key = ?', [api_key], one=True)
    return None

@app.route('/api/auth/user', methods = ['POST'])
def login():
    if request.method == 'POST':
        userName = request.headers['userName']
        password = request.headers['password']
        user = query_db('SELECT id, api_key, name FROM users WHERE name = ? AND password = ?', [userName, password], one=True)
        
        if not user:
            return jsonify({'error': 'Invalid credentials'}), 401
        
        return jsonify({'api_key': user['api_key'], 'user_id': user['id'], 'user_name': user['name']}), 200
    
    return jsonify({'error': 'Method Not Allowed'}), 405

@app.route('/api/signup/details', methods = ['POST'])
def signup_details():
    if request.method == 'POST':
        userName = request.headers['userName']
        password = request.headers['password']
        api_key = ''.join(random.choices(string.ascii_lowercase + string.digits, k=40))
        user = query_db('insert into users (name, password, api_key) values (?, ?, ?) returning id, name, password, api_key',
                            (userName, password, api_key), one=True)
        
        if not user:
            return jsonify({'error': 'Failed to signup'}), 401
        
        return jsonify({'api_key': user['api_key'], 'user_id': user['id'], 'user_name': user['name']}), 200
    
    return jsonify({'error': 'Method Not Allowed'}), 405

@app.route('/api/room/messages', methods=['GET'])
def get_all_messages():
    out = {'allM': []}
    user = validate_user_api_key(request)
    if not user:
        return app.send_static_file('404.html'), 401
    if request.method == 'GET':
        room_id = request.args['room_id']
        msgs = query_db('with tmp as (select count(m.replies_to) as replies, m.replies_to, m.id, u.name, m.body, m.channel_id from messages m, ' + 
                        'users u where m.channel_id = ? and m.user_id = u.id and m.replies_to > 0 group by m.replies_to ' + 
                        'order by m.id), tmp2 as (select ifnull(tmp.replies, 0) as repliescount, m.id, u.name, m.body, ' + 
                        'm.replies_to, m.channel_id from messages m inner join users u on m.user_id = u.id left join tmp on m.id = tmp.replies_to and m.channel_id = tmp.channel_id) ' + 
                        'select * from tmp2 where tmp2.replies_to == 0 and tmp2.channel_id = ?', [room_id, room_id], one=False)
        
        if not msgs:
            return out
        msgsList = []
        for msg in msgs:
            msgsList.append({'id': msg[1], 'name': msg[2], 'body': msg[3], 'replies': msg[0]})
        out['allM'] = msgsList
    return out, 200

@app.route('/api/rooms', methods=['GET'])
def get_all_rooms():
    out = {'allC': []}
    user = validate_user_api_key(request)
    if not user:
        return app.send_static_file('404.html'), 401
    if request.method == 'GET':
        rooms = query_db('select * from channels')
        roomsList = []
        if rooms is not None:
            for msg in rooms:
                roomsList.append({'id': msg['id'], 'name': msg['channel_name']})
        out['allC'] = roomsList
    return out, 200

@app.route('/api/room/post', methods=['POST'])
def post_message():
    user = validate_user_api_key(request)
    if not user:
        return app.send_static_file('404.html'), 401
    if request.method == 'POST':
        u = query_db('insert into messages (user_id, channel_id, body, replies_to) ' + 
            'values (?, ?, ?, ?) returning id, user_id, channel_id, body',
            (request.headers['User-Id'], request.args['room_id'], request.args['body'], 0), one=True)
        return {'status': 'Success'}, 200


@app.route('/api/update/username', methods=['POST'])
def update_username():
    user = validate_user_api_key(request)
    if not user:
        return app.send_static_file('404.html'), 401
    
    if request.method == 'POST':
        temp = query_db('update users set name = ? where api_key = ? returning id, name',
            (request.args['user_name'], request.headers['Api-Key']),
            one=True
        )
        return {'name': temp['name']}
    return {}

@app.route('/api/update/password', methods=['POST'])
def update_password():
    user = validate_user_api_key(request)
    if not user:
        return app.send_static_file('404.html'), 401
    
    if request.method == 'POST':
        temp = query_db('update users set password = ? where api_key = ? returning id, name',
            (request.headers['Password'], request.headers['Api-Key']),
            one=True
        )
        return {}, 200
    return {'Status': 'Failed for Unknown Reasons'}, 403


@app.route('/api/rooms/new', methods=['POST'])
def create_room():
    user = validate_user_api_key(request)
    if not user:
        return app.send_static_file('404.html'), 401

    if (request.method == 'POST'):
        name = request.args['channelName']
        room = query_db('insert into channels (channel_name) values (?) returning id', [name], one=True)            
        return {'channel_id': room["id"]}

@app.route('/api/update/room', methods=['POST'])
def update_room():
    user = validate_user_api_key(request)
    if not user:
        return app.send_static_file('404.html'), 401
    
    if request.method == 'POST':
        temp = query_db('update channels set channel_name = ? where id = ? returning id, channel_name',
            (request.args['name'], request.args['room_id']),
            one=True
        )
        return {}, 200
    return app.send_static_file('404.html'), 401


@app.route('/api/room/reply', methods=['POST'])
def post_reply():
    user = validate_user_api_key(request)
    if not user:
        return app.send_static_file('404.html'), 401
    if request.method == 'POST':
        u = query_db('insert into messages (user_id, channel_id, body, replies_to) ' + 
            'values (?, ?, ?, ?) returning id, user_id, channel_id, body, replies_to',
            (request.headers['User-Id'], request.args['room_id'], request.args['body'], request.args['message_id'] ), one=True)
        return {'status': 'Success'}, 200

@app.route('/api/room/replies', methods=['GET'])
def get_all_replies():
    out = {'allR': []}
    user = validate_user_api_key(request)
    if not user:
        return app.send_static_file('404.html'), 401
    if request.method == 'GET':
        room_id = request.args['room_id']
        message_id = request.args['message_id']
        msgs = query_db('select m.id, u.name, m.body from messages m, users u ' + 
                       'where m.channel_id = ? and m.replies_to = ? and m.user_id = u.id order by m.id', [room_id, message_id], one=False)
        if not msgs:
            return out
        msgsList = []
        for msg in msgs:
            msgsList.append({'id': msg[0], 'name': msg[1], 'body': msg[2], 'replies': 1})
        out['allR'] = msgsList
    return out, 200

@app.route('/api/reply/parent', methods=['GET'])
def get_message_name():
    out = {'allM': []}
    user = validate_user_api_key(request)
    if not user:
        return app.send_static_file('404.html'), 401
    if request.method == 'GET':
        message_id = request.args['message_id']
        msgs = query_db('select m.body from messages m where m.id = ?', [message_id], one=True)
        if not msgs:
            return out
        out['allM'].append({'name': msgs['body']})
    return out, 200

@app.route('/api/message/emojis', methods=['GET'])
def get_all_emojjis():
    out = {'allE': []}
    user = validate_user_api_key(request)
    if not user:
        return app.send_static_file('404.html'), 401
    if request.method == 'GET':
        message_id = request.args['message_id']
        emoji_id = request.args['emoji_id']
        
        msgs = query_db('select user_id, name from emojis e, users u where msg_id= ? and emoji_id = ? and u.id = e.user_id', [message_id, emoji_id], one=False)
        if not msgs:
            return out
        emojis = []
        for msg in msgs:
            emojis.append(msg['name'])
        out['allE'] = emojis
    return out, 200

@app.route('/api/message/emojipost', methods=['POST'])
def post_emoji():
    user = validate_user_api_key(request)
    if not user:
        return app.send_static_file('404.html'), 401
    if request.method == 'POST':
        u = query_db('insert into emojis values (?, ?, ?)',
            (request.args['emoji_id'], request.args['message_id'], request.headers['User-Id'] ), one=True)
        return {'status': 'Success'}, 200

@app.route('/api/user/unread', methods=['GET'])
def get_user_unread():
    out = {'allUr': {}}
    user = validate_user_api_key(request)
    if not user:
        return app.send_static_file('404.html'), 401
    if request.method == 'GET':
        user_id = request.headers['User-Id']
        
        msgs = query_db('select count(m.channel_id) numb, channel_id from messages m where m.replies_to = 0 and m.channel_id in '+ 
                        '(select distinct channel_id from messages except select distinct channel_id from groups_people where user_id = ?) ' + 
                        'group by m.channel_id union select count(m.channel_id) numb, m.channel_id from messages m, groups_people ' +
                        'gp where m.replies_to = 0 and m.channel_id = gp.channel_id and m.id > gp.message_id and gp.user_id = ? group by m.channel_id', (user_id, user_id), one=False)
        if not msgs:
            return out
        for msg in msgs:
            out['allUr'][msg ['channel_id']] = msg['numb']
    return out, 200

@app.route('/api/update/user/unread', methods=['POST'])
def update_unread():
    user = validate_user_api_key(request)
    if not user:
        return app.send_static_file('404.html'), 401
    if request.method == 'POST':
        user_id = request.headers['User-Id']
        channel_id = request.args['channel_id']
        d = query_db('delete from groups_people where user_id = ? and channel_id = ?', (user_id, channel_id), one=True)
        u = query_db('insert into groups_people select ?, ?, max(id) from messages where channel_id = ?', (request.headers['User-Id'], channel_id, channel_id), one=True)
        return {'status': 'Success'}, 200
