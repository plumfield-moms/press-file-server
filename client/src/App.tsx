import {ProofArrayModel, UserModel} from "@/types";
import {Spinner} from "@/components/ui/spinner.tsx";
import {toast} from "@/components/ui/toast.tsx";
import {useQuery} from "@tanstack/react-query";
import {useState} from "react";
import {ProofColumns} from "@/components/ProofColumns.tsx";

function useUser(){
  return useQuery({
    queryKey: ["users"],
    queryFn: async ({signal})=>{
      const res = await fetch(`/api/me`, { signal });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data = await res.json();
      return UserModel.parse(data);
    }
  })
}

function useProofs(){
  return useQuery({
    queryKey: ["proofs"],
    queryFn: async ({signal})=>{
       const res = await fetch(`/api/proofs`, { signal });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data = await res.json();
      return ProofArrayModel.parse(data);
    }
  })
}

function App() {
  const {data: user, error, isLoading} = useUser()
  const {data: proofs, error: proofError} = useProofs()
  const [active, setActive] = useState<string | null>()

if(error){
  toast.add({
    type:"error",
    description: error.message
  })
}
if(proofError){
  toast.add({
    type:"error",
    description: proofError.message
  })
}
  if(isLoading){
    return <Spinner/>
  }
  if(!user){
    // TODO: Add unauthorized state
    return <div>Error</div>
  }
if(proofs)
return <>
  <p>{active}</p>
  {<ProofColumns proofs={proofs} setActive={setActive} stage={user.username}/> }
  </>

}



export default App;