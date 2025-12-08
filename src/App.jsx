import Chat from "./component/chat/chat"
import Detail from "./component/detail/detail"
import List from "./component/list/list"
import Login from "./component/login/login"
import Notification from "./component/notification/notification"

const App = () => {
  const user = false;
  return (
    <div className='container'>
      {user ? (
        <>
      <List />
      <Chat />
      <Detail />
      </>
      ) : (
        <Login />
      )}
      <Notification />
    </div>
  )
}

export default App