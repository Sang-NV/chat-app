import "./detail.css"

const Detail = () => {
  return (
    <div className='detail'>
      <div className="user">
        <img src="./avatar.png" alt="" />
        <h2>SNV</h2>
        <p>Online</p>
      </div>
      <div className="info">
        
        <div className="option">
          <div className="title">
            <span>Chat Setting</span>
            <img src="./arrowUp.png" alt="" />
          </div>
        </div>
        <div className="option">
          <div className="title">
            <span>Privacy & help</span>
            <img src="./arrowUp.png" alt="" />
          </div>
        </div>
        <div className="option">
          <div className="title">
            <span>Shared photo</span>
            <img src="./arrowDown.png" alt="" />
          </div>
          <div className="photo">
            
             <div className="photoItem">
              <div className="photoDetail">
              <img src="https://cdn.pixabay.com/photo/2024/05/26/10/15/bird-8788491_1280.jpg" alt="" />
              <span>Photo_2025_2.png</span>
              </div>
            <img src="./download.png" alt=""className="icon"/>
            </div>
             <div className="photoItem">
              <div className="photoDetail">
              <img src="https://cdn.pixabay.com/photo/2024/05/26/10/15/bird-8788491_1280.jpg" alt="" />
              <span>Photo_2025_2.png</span>
              </div>
            <img src="./download.png" alt=""className="icon" />
            </div>
             <div className="photoItem">
              <div className="photoDetail">
              <img src="https://cdn.pixabay.com/photo/2024/05/26/10/15/bird-8788491_1280.jpg" alt="" />
              <span>Photo_2025_2.png</span>
              </div>
            <img src="./download.png" alt="" className="icon"/>
            </div>
          </div>
        </div>
        <div className="option">
          <div className="title">
            <span>Shared Files</span>
            <img src="./arrowUp.png" alt="" />
          </div>
        </div>
      <button>Block User</button>
      <button className="logout">Logout</button>
      </div>
    </div>
  )
}
export default Detail