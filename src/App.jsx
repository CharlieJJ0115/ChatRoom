import { useState } from "react";

import { useAuth } from "./contexts/AuthContext";

import LoginPage from "./pages/LoginPage";

import RegisterPage from "./pages/RegisterPage";

import ChatPage from "./pages/ChatPage";

function App() {

  const { currentUser } = useAuth();

  const [isLogin, setIsLogin] = useState(true);

  // 已登入
  if (currentUser) {

    return <ChatPage />;

  }

  // 未登入
  return (

    <div>

      {isLogin ? <LoginPage /> : <RegisterPage />}

      <button onClick={() => setIsLogin(!isLogin)}>

        {isLogin
          ? "Need an account?"
          : "Already have an account?"
        }

      </button>

    </div>

  );
}

export default App;