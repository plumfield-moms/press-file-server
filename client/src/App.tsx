import {ProofArrayModel, ProofHandlers, ProofUpdate, UserModel} from "@/types";
import {Spinner} from "@/components/ui/spinner.tsx";
import {toast} from "@/components/ui/toast.tsx";
import {useQuery,useQueryClient} from "@tanstack/react-query";
import {useState, useEffect} from "react";
import {ProofColumns} from "@/components/ProofColumns.tsx";
import {ProofCard} from "@/components/Proof.tsx";
import {Nav} from "@/components/Nav.tsx";

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
  const queryClient = useQueryClient();
  const {data: user, error, isLoading} = useUser()
  const {data: proofs, error: proofError} = useProofs()
  const [currentTitle, setCurrentTitle] = useState("")
  const [currentNotes, setCurrentNotes] = useState("")
  const [proofID, setProofID] = useState("")

  useEffect(() => {
  if (!proofID || !proofs) return;
  const current = proofs.find((p) => p.id === proofID);
  if (!current) {
    // proof disappeared from the list (e.g. filtered out by stage) — clear selection
    setActive(null);
    setProofID("");
    return;
  }
  setCurrentTitle(current.title);
  setCurrentNotes(current.notes ?? "");
  setActive({
    setTitle: setCurrentTitle,
    setNotes: setCurrentNotes,
    ...current
  });
}, [proofs, proofID]);

  const [active, setActive] = useState<ProofUpdate | null>()

  // Handles the active state of the proof
  function handleActive(active: string){
  const exists = proofs?.some((p) => p.id === active)
  if (!exists){
    toast.add({ type:"error", description:`Proof ${active} not found` })
    return
  }
  setProofID(active)
}
// Handles submitting an update
  async function handleSubmit(file: File){
    const formData = new FormData();
    formData.append("proof_json", JSON.stringify({
        title: currentTitle,
        notes: currentNotes,
        stage: user?.username,
        id: proofID
    }));
    if (file) {
        formData.append("file", file);
    }
    const res = await fetch(`/api/proofs/${proofID}/update`, {
        method: "POST",
        body: formData,
    });
    if (!res.ok) {
      toast.add({
        type: "error",
        description: await res.text()
      })
    }else{
      toast.add({
        description:"Success!"
      })
      await queryClient.invalidateQueries({ queryKey: ["proofs"] });
    }
  }
  // function handleDownload(){
  //   return
  // }

  // const for passing handlers to the proof card
const handlers: ProofHandlers = {
    submit: handleSubmit,
  // download: handleDownload
}
if(error){
  toast.add({
    type:"error",
    description: error.message
  })
}
if(proofError){
  return <div>{proofError.message}</div>
}
  if(isLoading){
    return <Spinner/>
  }
  if(!user){
    // TODO: Add unauthorized state
    return <div>Error</div>
  }
  const activeProof: ProofUpdate | null = active ? {
  ...active,
    title: currentTitle,
    notes: currentNotes
} : null;
if(proofs)

return ( <>
  <Nav admin={user.role == "admin"} queryClient={queryClient}/>

    <div className={"flex flex-col md:flex-row gap-3 p-4"}>
  {activeProof?
      <ProofCard key={activeProof.id} proof={activeProof} handlers={handlers} edit={activeProof.can_edit}/>:<div className="w-full md:h-screen h-85 rounded-md  flex items-center justify-center border-2 border-plum-light border-dashed"><span className="text-center">No Proof Selected</span> </div>}
  <ProofColumns proofs={proofs} setActive={handleActive} stage={user.username}/>

  </div>
</>)

}



export default App;