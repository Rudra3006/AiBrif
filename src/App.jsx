
import React from "react";

export default function App() {
  const card = {
    background:"#ffffff",
    borderRadius:"16px",
    padding:"24px",
    marginBottom:"16px",
    textAlign:"center",
    fontWeight:"600",
    boxShadow:"0 2px 10px rgba(0,0,0,0.08)"
  };

  return (
    <div style={{background:"#e9eef5",minHeight:"100vh",display:"flex",justifyContent:"center"}}>
      <div style={{display:"flex",width:"100%",maxWidth:"1400px"}}>

        <div style={{flex:"1",padding:"20px",display:"none"}}></div>

        <div style={{width:"420px",maxWidth:"100%",background:"#f7f9fc",minHeight:"100vh"}}>

          <div style={{background:"#ffffff",padding:"12px",position:"sticky",top:0}}>
            <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
              <button>☰</button>
              <input
                placeholder="Search Members"
                style={{flex:1,padding:"10px",borderRadius:"10px"}}
              />
              <div style={{fontWeight:"700"}}>MyLife</div>
              <div>🧬</div>
            </div>
          </div>

          <div style={{padding:"16px"}}>
            <div style={card}>Family Tree</div>
            <div style={card}>Family Friends Tree</div>
            <div style={card}>Colleague</div>
          </div>

          <div style={{
            position:"fixed",
            bottom:0,
            width:"420px",
            maxWidth:"100%",
            background:"#fff",
            display:"flex",
            justifyContent:"space-around",
            padding:"12px"
          }}>
            <span>Home</span>
            <span>Members</span>
            <span>Birthdays</span>
            <span>Notes</span>
            <span>Menu</span>
          </div>
        </div>

        <div style={{flex:"1",padding:"20px",display:"none"}}></div>
      </div>
    </div>
  );
}
