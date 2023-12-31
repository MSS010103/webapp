import React, { createContext, useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';

const SocketContext = createContext();

 const socket = io('http://localhost:5000');
const ContextProvider=({children})=>{
    const [stream, setStream]=useState(null);
    const [me,setMe]=useState('');
    const [call,setCall]=useState({});
    const [callAccepted,setCallAccepted]=useState(false);
    const [callEnded,setCallEnded]=useState(false);
    const [name, setName] = useState('');

    const myVideo=useRef();
    const userVideo=useRef();
    const connectionRef=useRef();

    useEffect(()=>{
        navigator.mediaDevices.getUserMedia({video:true,audio:true})
      .then((currentStream)=>{//stream uthai camera se when getUserMedia=true ie user grnts permission
            setStream(currentStream);//set kia stream ko

            myVideo.current.srcObject=currentStream;
            //myVideo.current refers to the actual DOM element (in this case, a <video> element),
            // and srcObject is a property of the <video> element that can be set to a media stream.
            //By assigning currentstream to myVideo.current.srcObject, you're telling the browser to 
            //use the specified media stream as the source for the video element
        });
     
       socket.on('me',(id)=> setMe(id)); 

       socket.on('callUser',({from, name: callername, signal})=>{

        setCall({isReceivedCall:true, from, name: callername, signal})
       })
    },[]);

    const answerCall = () => {
        setCallAccepted(true);
    
        const peer = new Peer({ initiator: false, trickle: false, stream });
    
        peer.on('signal', (data) => {
          socket.emit('answerCall', { signal: data, to: call.from });
        });
    
        peer.on('stream', (currentStream) => {
          userVideo.current.srcObject = currentStream;
        });
    
        peer.signal(call.signal);
    
        connectionRef.current = peer;
      };

      const callUser = (id) => {
        const peer = new Peer({ initiator: true, trickle: false, stream });
    
        peer.on('signal', (data) => {
          socket.emit('callUser', { userToCall: id, signalData: data, from: me, name });
        });
    
        peer.on('stream', (currentStream) => {
          userVideo.current.srcObject = currentStream;
        });
    
        socket.on('callAccepted', (signal) => {
          setCallAccepted(true);
    
          peer.signal(signal);
        });
    
        connectionRef.current = peer;
      };

      const leaveCall=() => {
        setCallEnded(true);
        connectionRef.current.destroy();

        window.location.reload();//to give user a new id
      }
    return (
        <SocketContext.Provider value={{stream,me,call,callAccepted,callEnded,name,myVideo,userVideo,setName,answerCall,callUser,leaveCall}}>
            {children}
        </SocketContext.Provider>
    );
}

export {ContextProvider,SocketContext};