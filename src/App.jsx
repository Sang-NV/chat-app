import Chat from "./component/chat/chat"
import Detail from "./component/detail/detail"
import List from "./component/list/list"
import Login from "./component/login/login"

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
    </div>
  )
}

export default App