import React, { useState, useRef, useEffect } from "react";
import "./App.css";

const WS_URL = import.meta.env.VITE_WS_URL;

function App() {
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const [joined, setJoined] = useState(false);
  const [messages, setMessages] = useState<{ user: string; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [createdRoomId, setCreatedRoomId] = useState("");
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (joined && !ws.current) {
      ws.current = new WebSocket(WS_URL);
      ws.current.onopen = () => {
        ws.current?.send(
          JSON.stringify({ type: "join", payload: { roomId, username } })
        );
      };
      ws.current.onmessage = (event) => {
        try {
          const msgObj = JSON.parse(event.data);
          setMessages((prev) => [...prev, msgObj]);
        } catch {
          // fallback for old messages
          setMessages((prev) => [...prev, { user: "", text: event.data }]);
        }
      };
      ws.current.onclose = () => {
        ws.current = null;
      };
    }
    return () => {
      ws.current?.close();
      ws.current = null;
    };
    // eslint-disable-next-line
  }, [joined, roomId, username]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim() && username.trim()) {
      setJoined(true);
      setMessages([]);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && ws.current?.readyState === 1) {
      ws.current.send(
        JSON.stringify({ type: "chat", payload: { message: input, username } })
      );
      setInput("");
    }
  };

  const handleCreateRoom = () => {
    const newRoomId = Math.random().toString(36).substring(2, 8);
    setCreatedRoomId(newRoomId);
    setRoomId(newRoomId);
  };

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4 flex flex-col items-center justify-center">
      <div className="w-full h-full px-4">
        <h1 className="text-5xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
          💬 Chat Space
        </h1>

        {!joined ? (
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-xl space-y-6 max-w-md mx-auto">
            {!showJoinForm && !createdRoomId ? (
              // Initial screen with two options
              <div className="space-y-6">
                <div className="text-center text-xl text-gray-700 mb-8">
                  Choose an option to start chatting
                </div>
                <button
                  onClick={() => setShowJoinForm(true)}
                  className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:opacity-90 transition-all duration-200 font-medium text-lg"
                >
                  Join Existing Room
                </button>
                <button
                  onClick={handleCreateRoom}
                  className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:opacity-90 transition-all duration-200 font-medium text-lg"
                >
                  Create New Room
                </button>
              </div>
            ) : (
              // Form for either joining or showing created room
              <form className="space-y-6" onSubmit={handleJoin}>
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="Enter Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 text-black rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white/50"
                    required
                  />
                </div>

                {createdRoomId ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                      <div className="text-sm text-purple-600 mb-1">
                        Room Created! ID:
                      </div>
                      <div className="text-2xl font-mono text-purple-700 select-all text-center">
                        {createdRoomId}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Enter Room ID"
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value)}
                      className="w-full px-4 py-3 text-black rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white/50"
                      required
                    />
                  </div>
                )}

                <div className="space-y-4">
                  <button
                    type="submit"
                    className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:opacity-90 transition-all duration-200 font-medium"
                  >
                    {createdRoomId ? "Enter Room" : "Join Room"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowJoinForm(false);
                      setCreatedRoomId("");
                      setRoomId("");
                    }}
                    className="w-full px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                  >
                    Back to Options
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl w-full h-full mx-auto flex flex-col">
            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
              <div className="flex gap-4">
                <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-medium">
                  Room: {roomId}
                </span>
                <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                  User: {username}
                </span>
              </div>
              <button
                className="px-4 py-1 text-red-500 hover:bg-red-50 rounded-full transition-all duration-200"
                onClick={() => {
                  setJoined(false);
                  ws.current?.close();
                }}
              >
                Leave Room
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No messages yet. Start the conversation! 💭
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${
                      msg.user === username ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] break-words rounded-2xl px-4 py-2 ${
                        msg.user === username
                          ? "bg-gradient-to-r bg-purple-500 text-white"
                          : "bg-purple-300"
                      }`}
                    >
                      <div
                        className={`text-xs mb-1 font-medium ${
                          msg.user === username
                            ? "text-blue-100"
                            : "text-purple-500"
                        }`}
                      >
                        {msg.user || "Unknown"}
                      </div>
                      <div className="text-sm">{msg.text}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <form className="mt-4 flex gap-2" onSubmit={handleSend}>
              <input
                type="text"
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 px-4 text-black py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                required
              />
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full hover:opacity-90 transition-all duration-200"
              >
                Send
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
