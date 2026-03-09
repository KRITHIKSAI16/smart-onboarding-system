import { useEffect, useState } from "react";
import API from "../services/api";

export default function Dashboard(){

 const [tasks,setTasks]=useState([]);
 const [progress,setProgress]=useState({});

 const token=localStorage.getItem("token");

 useEffect(()=>{

  API.get("/tasks",{
    headers:{Authorization:`Bearer ${token}`}
  }).then(res=>{
    setTasks(res.data);
  });

  API.get("/tasks/progress",{
    headers:{Authorization:`Bearer ${token}`}
  }).then(res=>{
    setProgress(res.data);
  });

 },[]);

 return(

 <div className="p-8 bg-gray-100 min-h-screen">

 <h1 className="text-3xl font-bold mb-6">
 Dashboard
 </h1>

 <div className="bg-white p-6 rounded shadow mb-6">

 <h2 className="text-xl font-semibold mb-2">
 Progress
 </h2>

 <div className="w-full bg-gray-200 rounded h-4">

 <div
 className="bg-green-500 h-4 rounded"
 style={{width:progress.progress}}
 ></div>

 </div>

 <p className="mt-2">
 {progress.completed}/{progress.totalTasks} tasks completed
 </p>

 </div>

 <h2 className="text-xl font-semibold mb-3">
 Tasks
 </h2>

 <div className="grid grid-cols-3 gap-4">

 {tasks.map(task=>(
 <div
 key={task._id}
 className="bg-white p-4 rounded shadow"
 >

 <h3 className="font-bold">
 {task.title}
 </h3>

 <p className="text-sm text-gray-500">
 {task.description}
 </p>

 </div>
 ))}

 </div>

 </div>

 );
}