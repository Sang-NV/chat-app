import "./list.css"
import Userinfor from "./userinfor/userinfor.jsx"
import ChatList from "./chatList/chatList.jsx"

const List = () => {
  return (
    <div className='list'>
      <Userinfor />
      <ChatList />
    </div>
  )
}
export default List