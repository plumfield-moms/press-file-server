import {Dialog, DialogTrigger} from "@/components/ui/dialog.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Admin} from "@/components/Admin.tsx";
import {toast} from "@/components/ui/toast.tsx";
import {QueryClient} from "@tanstack/react-query";

export function  Nav({admin, queryClient}:{admin: boolean, queryClient: QueryClient}){
    if(!admin){
        return <nav className="p-4 bg-plum text-paper sticky top-0 flex justify-between text-center z-100"><span className="font-bold">Plumfield Press</span></nav>
    }

    async function handleSubmit(file: File, title: string){
        const formData = new FormData();
        formData.append("title", title)
        formData.append("file", file)
        const res = await fetch(`/api/new`, {
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
    return (
        <Dialog>
        <nav className="justify-between p-4 bg-plum text-paper sticky top-0 flex text-center z-100">
            <span className="font-bold">Plumfield Press</span>
            <DialogTrigger render={<Button variant={"secondary"}>Create</Button>} />
        </nav>
            <Admin submit={handleSubmit}/>
        </Dialog>)
}