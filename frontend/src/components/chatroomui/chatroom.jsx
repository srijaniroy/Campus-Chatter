import React, { useContext, useEffect, useRef, useState } from "react";
import { chatRoomApi } from "../contexts/chatRoomApi";
import useWebSocket from "react-use-websocket";
import { ReadyState } from "react-use-websocket";

const Chatroom = () => {
  const userId = localStorage.getItem("userId");
  const roomId = localStorage.getItem("roomId");
  const [allMsg, setAllMsg] = useState([]);
  const [myMsg, setMyMsg] = useState("");
  const messageEndRef = useRef(null); // For auto-scroll

  // WebSocket connection
  const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket('ws://localhost:8080');

  // Initial query to join the room
  useEffect(() => {
    const tosend = {
      type: "joinRoom",
      data: {
        userId: userId,
        roomId: roomId,
      }
    };
    sendJsonMessage(tosend);
  }, [roomId, userId, sendJsonMessage]);

  // Handling incoming messages
  useEffect(() => {
    if (lastJsonMessage !== null) {
      if (lastJsonMessage.type === "error") {
        alert("Room not connected...");
      } else if (lastJsonMessage.type === "newMessage" && lastJsonMessage.data.roomId === roomId) {
        const data = lastJsonMessage.data.message;
        setAllMsg(prev => [...prev, {
          senderId: data.senderId,
          message: data.content,
          at: data.timestamp,
        }]);
      }
    }
  }, [lastJsonMessage, roomId]);

  // Auto-scroll to the bottom when messages are updated
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [allMsg]);

  // Submit message function
  const submit = () => {
    const tosend = {
      type: "sendMessage",
      data: {
        roomId: roomId,
        userId: userId,
        message: myMsg
      }
    };
    sendJsonMessage(tosend);
    setAllMsg(prev => [...prev, {
      senderId: "you",
      message: myMsg,
      at: new Date().toISOString(),
    }]);
    setMyMsg(""); // Clear input field
  };

  // Format date
  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };

  const constatus = {
    [ReadyState.CONNECTING]: 'Connecting',
    [ReadyState.OPEN]: 'Open',
    [ReadyState.CLOSING]: 'Closing',
    [ReadyState.CLOSED]: 'Closed',
    [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
  }[readyState];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-800 to-slate-600 p-4 text-white">
      <div className="max-w-4xl mx-auto w-full flex-grow flex flex-col bg-slate-900/80 rounded-lg shadow-lg p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-yellow-300 text-lg font-semibold">
            Connection Status: <span className="font-normal">{constatus}</span>
          </h4>
          <div className="text-gray-300">
            Room ID: <span className="font-semibold">{roomId || "null"}</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-grow overflow-y-auto p-4 bg-gray-800 rounded-lg shadow-inner max-h-full scrollbar-thin scrollbar-thumb-gray-500">
          {allMsg.length ? (
            allMsg.map((data, index) => (
              data.senderId !== userId ? (
              <div
                key={index}
                className={`p-4 rounded-lg shadow-md space-y-2 ${
                  data.senderId === "you" ? "bg-green-700 ml-auto" : "bg-slate-700 mr-auto"
                } max-w-xs`}
              >
                <div>{data.senderId === "you" ? "You" : data.senderId}</div>
                <div>
                  <b>{data.message}</b>
                </div>
                <div className="text-sm text-gray-400">Sent at: {formatDate(data.at)}</div>
              </div>
              ) : null
            ))
          ) : (
            <div className="text-gray-400">No messages yet</div>
          )}
          <div ref={messageEndRef}></div>
        </div>

        {/* Input Section */}
        <div className="mt-4 flex space-x-4 items-center">
          <input
            type="text"
            placeholder="Type a message..."
            value={myMsg}
            onChange={(e) => setMyMsg(e.target.value)}
            className="flex-1 p-3 rounded-lg bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
          <button
            onClick={submit}
            className="bg-yellow-400 text-slate-800 p-3 rounded-lg shadow-lg font-semibold hover:bg-yellow-300 transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatroom;
