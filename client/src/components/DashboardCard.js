import React from "react";

export default function DashboardCard({title,value}){

return(

<div style={{
background:"white",
padding:"20px",
margin:"10px",
border:"1px solid #ccc",
width:"200px"

}}>

<h4>{title}</h4>

<h2>{value}</h2>

</div>

)

}