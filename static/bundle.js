let path = window.location.pathname;
const POST_MESSAGE = '/api/room/post'
const POST_REPLY_MESSAGE = '/api/room/reply'
const SIGNUP_POINT = '/api/signup';
const SIGNUP_DETAILS_POINT = '/api/signup/details';
const LOGIN_POINT = '/api/auth/user';
const UPDATE_USERNAME = '/api/update/username';
const UPDATE_PASSWORD = '/api/update/password';
const NEW_ROOM_POINT = '/api/rooms/new';
const ALL_MESSAGES_URL = '/api/room/messages';
const ALL_REPLIES_URL = '/api/room/replies';
const ALL_ROOMS = '/api/rooms';
const UPDATE_ROOM = '/api/update/room';
const GET_NO_OF_EMOJIS = '/api/message/emojis';
const POST_EMOJI = '/api/message/emojipost';
const UNREAD_MSGS = '/api/user/unread';
const UPDATE_UNREAD = '/api/update/user/unread';
const ERROR = '/api/error';

let rooms = {};
let old_path = '';
let CURRENT_ROOM = 0;

let loginDict = {
userName: '',
password: ''
};

let getAllMsgsRequest = {
room_id: 0
};

let getAllRepliesRequest = {
room_id: 0,
message_id: 0
};

let postRequest = {
room_id: 0,
body: ''
};

let postReplyRequest = {
room_id: 0,
body: '',
message_id: 0,
replies_to: 0
};

let postUpdateUserNameRequest = {
user_name: ''
};

let postUpdatePasswordRequest = {
Password: ''
};

let postUpdateRoomRequest = {
name: '',
room_id: 0
};

let signUpDetails = {
userName: '',
Password: ''
};

let newRoomEndPoint = {
channelName: ''
};

let emojiDetails = {
message_id: '',
emoji_id: ''
};

let postEmoji = {
message_id: '',
emoji_id: ''
};

let updateUnread = {
message_id: '',
channel_id: ''
};

async function createUrl(endPoint, requestBody, requestHeader, endType){
    let url = endPoint + (Object.keys(requestBody).length > 0 
                            ? ("?" + Object.keys(requestBody).map((key) => key + "=" + encodeURIComponent(requestBody[key])).join("&")) 
                            : "");

    const urlHeaders = new Headers({
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Api-Key": localStorage.getItem('maneeshpudhota-api-key'),
        "User-Id": localStorage.getItem('maneeshpudhota-user-id')
    });
    
    Object.keys(requestHeader).forEach(function(key) {
        urlHeaders.append(key, requestHeader[key]);
    });
    
    const myInit = {
        method: endType,
        headers: urlHeaders,
    };

    let data = await fetch(url, myInit);
    let jsonForm = await data.json();
    return jsonForm
}
    
function isLoggedin() {
    return !(localStorage.getItem('maneeshpudhota-api-key') == null || localStorage.getItem('maneeshpudhota-api-key') == '')
};

const Image = ({ url, title }) => (
    <img src={url} alt={title} />
);

const Header = ({handleLogout}) => {
    const history = ReactRouterDOM.useHistory();
    const createNewRoom = () => {
        handleLogout();
        history.push('/newchannel');
    };

    const handleCompanyIconClick = () => {
        handleLogout();
        history.push('/belay');
    };

    const handleUpdateProfileClick = () => {
        handleLogout();
        history.push('/update');
    };

    const handleLogoutClick = () => {
        localStorage.clear();
        handleLogout();
        history.push('/login');
    };

    return (
        <div className="header">
            <div className="left-section" onClick={createNewRoom}>
                <button onClick={createNewRoom}>Cretae new channel</button>
            </div>
            <div className="center-section" onClick={handleCompanyIconClick}>
                <img src="/static/images/belay.png" alt="Company Icon" />
            </div>
            <div className="right-section">
                <button onClick={handleUpdateProfileClick}>Update Profile</button>
                <button onClick={handleLogoutClick}>Logout</button>
            </div>
        </div>
    );
};

function LogoutButton() {
    const history = ReactRouterDOM.useHistory();

    function handleLogout() {
        localStorage.clear();
        history.push('/belay');
    };

    return (
        <button className="logout-button" onClick={handleLogout}>
            Logout
        </button>
    );
};

function Login(){
    const history = ReactRouterDOM.useHistory();
    const location = ReactRouterDOM.useLocation();
    if(isLoggedin()){
        history.push('/belay')
        return <></>
    }
    
    const requestedPath = location.state?.requestedPath || '/';

    document.title = 'Login';
    const [formData, setFormData] = React.useState({
        username: '',
        password: ''
    });

    const handleLogin = async (e) => {
        e.preventDefault();
        loginDict.userName = formData.username;
        loginDict.password = formData.password;
        let loginUsr = await createUrl(LOGIN_POINT, {}, loginDict, 'POST');
        if(loginUsr.api_key.length > 0){
            localStorage.setItem('maneeshpudhota-api-key', loginUsr.api_key);
            localStorage.setItem('maneeshpudhota-user-id', loginUsr.user_id);
            localStorage.setItem('maneeshpudhota-user-name', loginUsr.user_name);

            setFormData({
                username: '',
                password: ''
            });

            if(requestedPath != '/'){
                history.replace(requestedPath);
            }
            else{
                history.push('/belay');
            }
        }
    };

    const handleInputChange = (e) => {
        const {name, value} = e.target
        setFormData({
            ...formData,
            [name]: value
        });
    };
    
    const openSignUp = (e) => {
        history.push('/signup');
    };

    return (<>
        <div className="container">
            <div className="form-container">
                <Image url={"static/images/belay.png"} title={"Belay Logo"}/>
                <h2>Login</h2>
                <form onSubmit={handleLogin} >
                    <input type='text' name='username' placeholder='Username' value={formData.username} onChange={handleInputChange} required />
                    <input type='password' name='password' placeholder='Password' value={formData.password} onChange={handleInputChange} required />
                    <input type='submit' value='Login'></input>
                </form>
                <div className="signup-prompt-container">
                    <p>Don't have an account?</p>
                    <button className="signup-button" onClick={openSignUp}>Signup</button>
                </div>
            </div>
        </div>
    </>)
}

function UpdateProfile(){
    const history = ReactRouterDOM.useHistory();
    if(!isLoggedin()){
        history.push('/login')
        return <></>
    }
    document.title = 'Profile Update';
    const [formData, setFormData] = React.useState({
        username: '',
        password: '',
        repeatedPassword: ''
    });
    const [passwordsMatch, setPasswordsMatch] = React.useState(true);

    const updateUserName = async (e) => {
        if(!passwordsMatch){
            return
        }
        e.preventDefault();
        postUpdateUserNameRequest.user_name = formData.username;
        await createUrl(UPDATE_USERNAME, postUpdateUserNameRequest, {}, 'POST');
        localStorage.setItem('maneeshpudhota-user-name', formData.username);
        setFormData({
            username: '',
        });
    };

    const updatePassword = async (e) => {
        if(!passwordsMatch){
            return
        }
        e.preventDefault();
        postUpdatePasswordRequest.Password = formData.password;
        let postMsg = await createUrl(UPDATE_PASSWORD, {}, postUpdatePasswordRequest, 'POST');
        setFormData({
            password: '',
            repeatedPassword: ''
        });
    };

    const handleInputChange = (e) => {
        const {name, value} = e.target

        setFormData({
            ...formData,
            [name]: value
        });

        if (name === 'repeatedPassword') {
            setPasswordsMatch(formData.password === value);
        }
    };

    const openLogin = (e) => {
        history.push('/belay');
    };

    return (<>
        <div className="container">
            <div className="form-container">
                <Image url={"static/images/belay.png"} title={"Belay Logo"}/>
                <h2>Update Profile</h2>
                <form onSubmit={updateUserName} >
                    <input type='text' name='username' placeholder='Username' value={formData.username} onChange={handleInputChange} required />
                    <input type='submit' value='Update username'></input>
                </form>

                <form onSubmit={updatePassword} >
                    <input type='password' name='password' placeholder='Password' value={formData.password} onChange={handleInputChange} required />
                    <input type='password' name='repeatedPassword' placeholder='Repeat Password' className={passwordsMatch ? '' : 'password-mismatch'} value={formData.repeatedPassword} onChange={handleInputChange} required />
                    <input type='submit' value='Update password'></input>
                </form>
            </div>

            <div className="signup-prompt-container">
                <p>Done with your changes?</p>
                <button className="signup-button" onClick={openLogin}>Let's go back...</button>
            </div>
        </div>
    </>)
}

function NewChannel(){
    const history = ReactRouterDOM.useHistory();
    if(!isLoggedin()){
        history.push('/login')
        return <></>
    }
    document.title = 'Create Channel';
    const [formData, setFormData] = React.useState({
        roomname: '',
    });

    const handleNewRoom = async (e) => {
        e.preventDefault();
        newRoomEndPoint.channelName = formData.roomname;
        let newRoom = await createUrl(NEW_ROOM_POINT, newRoomEndPoint, {}, 'POST');
        history.push('/channel/' + newRoom.channel_id);
    };

    const handleInputChange = (e) => {
        const {name, value} = e.target

        setFormData({
            ...formData,
            [name]: value
        });
    };

    return (<>
        <div className="container">
            <div className="form-container">
                <Image url={"static/images/belay.png"} title={"Belay Logo"}/>
                <h2>Create Channel</h2>
                <form onSubmit={handleNewRoom} >
                    <input type='text' name='roomname' placeholder='Channel Name' value={formData.roomname} onChange={handleInputChange} required />
                    <input type='submit' value='Create'></input>
                </form>
            </div>
        </div>
    </>)
}

function Signup(){
    const history = ReactRouterDOM.useHistory();
    if(isLoggedin()){
        history.push('/belay')
        return <></>
    }
    document.title = 'Signup';
    const [formData, setFormData] = React.useState({
        username: '',
        password: '',
        repeatedPassword: ''
    });
    const [passwordsMatch, setPasswordsMatch] = React.useState(true);

    const handleSignup = async (e) => {
        if(!passwordsMatch){
            return
        }
        e.preventDefault();
        loginDict.userName = formData.username;
        loginDict.password = formData.password;
        let loginUsr = await createUrl(SIGNUP_DETAILS_POINT, {}, loginDict, 'POST');
        if(loginUsr.api_key.length > 0){
            localStorage.setItem('maneeshpudhota-api-key', loginUsr.api_key);
            localStorage.setItem('maneeshpudhota-user-id', loginUsr.user_id);
            localStorage.setItem('maneeshpudhota-user-name', loginUsr.user_name);

            setFormData({
                username: '',
                password: '',
                repeatedPassword: ''
            });
            
            history.push('/belay');
        }
    };

    const handleInputChange = (e) => {
        const {name, value} = e.target

        setFormData({
            ...formData,
            [name]: value
        });

        if (name === 'repeatedPassword') {
            setPasswordsMatch(formData.password === value);
        }
    };

    const openLogin = (e) => {
        history.push('/login');
    };

    return (<>
        <div className="container">
            <div className="form-container">
                <Image url={"static/images/belay.png"} title={"Belay Logo"}/>
                <h2>Signup</h2>
                <form onSubmit={handleSignup} >
                    <input type='text' name='username' placeholder='Username' value={formData.username} onChange={handleInputChange} required />
                    <input type='password' name='password' placeholder='Password' value={formData.password} onChange={handleInputChange} required />
                    <input type='password' name='repeatedPassword' placeholder='Repeat Password' className={passwordsMatch ? '' : 'password-mismatch'} value={formData.repeatedPassword} onChange={handleInputChange} required />
                    <input type='submit' value='Signup'></input>
                </form>
                <div className="signup-prompt-container">
                    <p>Already have an account?</p>
                    <button className="signup-button" onClick={openLogin}>Login</button>
                </div>
            </div>
        </div>
    </>)
}
    

function HomePage({channelNo, messageNo}) {
    const history = ReactRouterDOM.useHistory();
    if(!isLoggedin()){
        const requestedPath = history.location.pathname;
        history.push('/login', { requestedPath })
        return <></>
    }
    
    document.title = 'Channel ' + channelNo;
    const [allChannels, setAllChannels] = React.useState([]);
    const [intervalId, setIntervalId] = React.useState(null);
    const [roomName, setNewRoomName] = React.useState("");
    const [editingChannel, setEditingChannel] = React.useState(-1);
    const [message, setMessage] = React.useState('');
    const [messages, setMessages] = React.useState([]);
    
    const [reply, setReply] = React.useState('');
    const [replies, setReplies] = React.useState([]);
    
    const [unReadMsgs, setUnreadMsgs] = React.useState({});
    
    const [emojiUsers, setEmojiUsers] = React.useState([]);
    const [whichEmoji, setWhichEmoji] = React.useState({
        'msgId': -1,
        'emojiId': -1
    });
    
    const handleMouseEnter = async (msg_id, emoji_id) => {
        emojiDetails.message_id = msg_id;
        emojiDetails.emoji_id = emoji_id;
        let retrievedEmojis = await createUrl(GET_NO_OF_EMOJIS, emojiDetails, {}, 'GET');
        setEmojiUsers(retrievedEmojis.allE)
        setWhichEmoji({
        'msgId': msg_id,
        'emojiId': emoji_id
        })
    };
    
    const handleMouseLeave = (msg_id, emoji_id) => {
        setWhichEmoji({
        'msgId': -1,
        'emojiId': -1
        });
    };
    
    const emojis = [
        { id: 1, symbol: '👍' },
        { id: 2, symbol: '❤️' },
        { id: 3, symbol: '😂' },
        { id: 4, symbol: '😊' },
        { id: 5, symbol: '😍' }
    ];
    
    const handleEmojiClick = async (messageId, emojiId) => {
        postEmoji.emoji_id = emojiId;
        postEmoji.message_id = messageId;
        await createUrl(POST_EMOJI, postEmoji, {}, 'POST')
    };
    
    const handleChannelClick = async (channel) => {
        history.push('/channel/' + channel);
    };
    
    
    function extractImageUrls(message) {
        const regex = /(https?:\/\/.*\.(?:png|jpg|gif))/gi;
        return message.match(regex) || [];
    }
    
    function displayImages(message) {
        const imageUrls = extractImageUrls(message);
        return imageUrls.map((imageUrl, index) => (
            <img key={index} src={imageUrl} alt={`Image ${index + 1}`} />
        ));
    }
    
    const sendMessage = async () => {
        if (message.trim() === '') return;
    
        postRequest.room_id = channelNo;
        postRequest.body = message;
        await createUrl(POST_MESSAGE, postRequest, {}, 'POST')
        setMessage('');
    };
    
    const sendReply = async () => {
        if (reply.trim() === '') return;
    
        postReplyRequest.room_id = channelNo;
        postReplyRequest.body = reply;
        postReplyRequest.message_id = messageNo;
        postReplyRequest.replies_to = messageNo;
        await createUrl(POST_REPLY_MESSAGE, postReplyRequest, {}, 'POST')
        setReply('');
    };
    
    const handleInputChange = (e) => {
        setMessage(e.target.value);
    };
    
    const handleInputReplyChange = (e) => {
        setReply(e.target.value);
    };
    
    const handleLogout = () => {
        clearInterval(intervalId);
    };
    
    React.useEffect(() => {
        const intervalId = setInterval(async () => {
            if (channelNo === 0) return;
    
            getAllMsgsRequest.room_id = channelNo;
            getAllRepliesRequest.room_id = channelNo;
            getAllRepliesRequest.message_id = messageNo;
            let retrievedMessages = await createUrl(ALL_MESSAGES_URL, getAllMsgsRequest, {}, 'GET');
            let rooms = await createUrl(ALL_ROOMS, {}, {}, 'GET')
            setMessages(retrievedMessages.allM);
            setAllChannels(rooms.allC);
            if(messageNo > 0){
            let replies = await createUrl(ALL_REPLIES_URL, getAllRepliesRequest, {}, 'GET')
            setReplies(replies.allR);
            }
            let unreadMsgs = await createUrl(UNREAD_MSGS, {}, {}, 'GET');
            setUnreadMsgs(unreadMsgs.allUr);
            updateUnread.channel_id = channelNo;
            if(messages != undefined && messages[messages.length - 1] != undefined)
            updateUnread.message_id = messages[messages.length - 1].id
            await createUrl(UPDATE_UNREAD, updateUnread, {}, 'POST')
        }, 300);
    
        setIntervalId(intervalId);
    
        return () => {
            clearInterval(intervalId);
        };
    }, [messages, channelNo]);
    
    const handleEditClick = (channel) => {
        setEditingChannel(channel);
    };
    
    const handleSaveClick = async (channel) => {
        if (roomName.trim() === '') return;
        postUpdateRoomRequest.room_id = channel;
        postUpdateRoomRequest.name = roomName;
        await createUrl(UPDATE_ROOM, postUpdateRoomRequest, {}, 'POST');
        setEditingChannel(-1);
    };
    
    const handleRoomNameChange = (e) => {
        const {name, value} = e.target
        setNewRoomName(value);
    };
    
    const handleReply = (messageId) => {
        history.push('/channel/' + channelNo + '/message/' + messageId);
    };
    
    const closeReplies = () => {
        history.push('/channel/' + channelNo);
    }
    
    return (
        <>
        <Header handleLogout={handleLogout}/>
        <div className="home-screen">
            <div className="channels-panel">
            <h2>Channels</h2>
            <ul>
                {allChannels.map(channel => (
                <>
                    {
                    editingChannel == channel.id ? (
                        <div className={channel.id == channelNo ? 'channel-item-container active' : 'channel-item-container'}>
                            <input name="newRoomName" onChange={handleRoomNameChange}></input>
                            <span className="material-symbols-outlined md-18" onClick={() => handleSaveClick(channel.id)}>save</span>
                        </div>
                    ) : (
                        <div key={channel.id} className={channel.id == channelNo ? 'channel-item-container active' : 'channel-item-container'} onClick={() => handleChannelClick(channel.id)}>
                            # {channel.name}
                            {unReadMsgs[channel.id] != undefined && unReadMsgs[channel.id] > 0 && (
                            <div className="unreadmsgs">
                                {unReadMsgs[channel.id]} {'New Messages'}
                            </div>
                            )}
                            <span key={channel.id + allChannels.length} className="material-symbols-outlined md-18" onClick={() => handleEditClick(channel.id)}>edit</span>
                        </div>
                    )
                    }
                </>
                ))}
            </ul>
            </div>
    
            <div className="message-container">
            <div className="conversation">
                {messages.map(msg => (
                    <>
                        <div key={msg.id} className="message">
                            <div className="author">{msg.name}</div>
                            <div className="body">{msg.body}</div>
                            {displayImages(msg.body)}
                            <div className="reply-button" onClick={() => handleReply(msg.id)}>
                            <span className="material-symbols-outlined md-18">reply</span>
                            </div>
                            <div className="emojis">
                            {emojis.map(emoji => (
                                <span
                                key={emoji.id}
                                className="emoji"
                                onClick={() => {
                                    handleEmojiClick(msg.id, emoji.id);
                                }}
                                onMouseEnter={() => handleMouseEnter(msg.id, emoji.id)} onMouseLeave={() => handleMouseLeave(msg.id, emoji.id)}
                                style={{ cursor: 'pointer', marginRight: '5px', fontSize: '20px' }}
                                >
                                <div className="tooltip">{emoji.symbol}{(emoji.id == whichEmoji['emojiId'] && msg.id == whichEmoji['msgId']) ? emojiUsers.length : <></>}
                                    {(emoji.id == whichEmoji['emojiId'] && msg.id == whichEmoji['msgId'] && emojiUsers.length > 0) ? (<span className="tooltiptext">{emojiUsers.map((name, index) => name + (index < (emojiUsers.length - 1) ? ", ": ""))}</span>) : <></>}
                                </div>
                                </span>
                            ))}
                            </div>
                            {msg.replies > 0 && (
                            <div className="replies" onClick={() => handleReply(msg.id)}>
                                {msg.replies} {msg.replies == 1 ? 'reply' : 'replies'}
                            </div>
                            )}
                        </div>
                    </>
                ))}
            </div>
    
            <div className="message-input">
                <input
                    type="text"
                    value={message}
                    onChange={handleInputChange}
                    placeholder="Type your message..."
                />
                <button onClick={sendMessage}>Send</button>
            </div>
            </div>
    
            {
            messageNo > 0 ? (
                <div className="replies-container">
                <div className="close-button" onClick={() => closeReplies()}>
                    <span className="material-symbols-outlined md-18">close</span>
                </div>
                <div className="conversation">
                    {replies.map(msg => (
                        <>
                        <div key={msg.id} className="message">
                            <div className="author">{msg.name}</div>
                            <div className="body">{msg.body}</div>
                            <div className="emojis">
                            {emojis.map(emoji => (
                                <span
                                    key={emoji.id}
                                    className="emoji"
                                    onClick={() => {
                                    handleEmojiClick(msg.id, emoji.id);
                                    }}
                                    onMouseEnter={() => handleMouseEnter(msg.id, emoji.id)} onMouseLeave={() => handleMouseLeave(msg.id, emoji.id)}
                                    style={{ cursor: 'pointer', marginRight: '5px', fontSize: '20px' }}
                                >
                                    <div className="tooltip">{emoji.symbol}{(emoji.id == whichEmoji['emojiId'] && msg.id == whichEmoji['msgId']) ? emojiUsers.length : <></>}
                                        {(emoji.id == whichEmoji['emojiId'] && msg.id == whichEmoji['msgId'] && emojiUsers.length > 0) ? (<span className="tooltiptext">{emojiUsers.map((name) => name + ", ")}</span>) : <></>}
                                    </div>
                                </span>
                                ))}
                            </div>
                        </div>
                        </>
                    ))}
                </div>
    
                <div className="message-input">
                    <input
                        type="text"
                        value={reply}
                        onChange={handleInputReplyChange}
                        placeholder="Type your message..."
                    />
                    <button onClick={sendReply}>Send</button>
                </div>
    
                </div>
            ) : (
                <></>
            )
            }
            
        </div>
        </>
    );
};      


ReactDOM.render(
<ReactRouterDOM.BrowserRouter>
    <div className="App">
        <ReactRouterDOM.Switch>
            <ReactRouterDOM.Route path="/signup" component={Signup}/>
            <ReactRouterDOM.Route
                path="/belay"
                render={props => (
                    <HomePage channelNo={'1'} />
                )}
            />
            <ReactRouterDOM.Route path="/login" component={Login} />
            <ReactRouterDOM.Route path="/update" component={UpdateProfile} />
            <ReactRouterDOM.Route
                path="/channel/:channelId/message/:messageId"
                render={props => (
                    <HomePage channelNo={props.match.params.channelId} messageNo={props.match.params.messageId} />
                )}
            />
            <ReactRouterDOM.Route
                path="/channel/:channelId"
                render={props => (
                    <HomePage channelNo={props.match.params.channelId} messageNo={-1} />
                )}
            />
            <ReactRouterDOM.Route
                path="/newchannel"
                render={props => (
                    <NewChannel />
                )}
            />
            <ReactRouterDOM.Route
                path="/"
                render={props => (
                    <HomePage channelNo={'1'} />
                )}
            />
        </ReactRouterDOM.Switch>
    </div>
</ReactRouterDOM.BrowserRouter>, document.getElementById('root'));
