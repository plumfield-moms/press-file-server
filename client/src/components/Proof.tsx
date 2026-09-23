import { ProofHandlers, ProofUpdate} from "@/types";
import {Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Input} from "@/components/ui/input.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Textarea} from "@/components/ui/textarea.tsx";
import { useState} from "react";
import {toast} from "@/components/ui/toast.tsx";
import {Badge} from "@/components/ui/badge.tsx";

export function ProofCard( {admin = false, proof, handlers, edit}:{admin: boolean, proof: ProofUpdate, handlers: ProofHandlers, edit: boolean,}){
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState<null | string>()
    const formattedStage = proof.stage[0].toUpperCase() + proof.stage.slice(1)

    const handleSubmit = () => {
        if (!file){
            toast.add({
                type:"error",
                description: "Please upload a file to submit"
            })
            return
        }
        if(!title){
            proof.setTitle(proof.title)
        }else{
            proof.setTitle(title)
        }
        handlers.submit(file);
    };
    return <Card className="w-full h-full">
        <CardHeader>
            <CardTitle>{admin?
                <Input value={proof.title} onChange={(e)=> setTitle(e.target.value)}/>
                :proof.title}
            </CardTitle>
            <CardAction><Button render={<a href={`/api/proofs/${proof.id}/download`}>Download</a>}/></CardAction>
        </CardHeader>
        <CardContent>
            <div className={"flex flex-row gap-2 pb-2 items-center"}>
            <h3 className="text-lg text-center">Stage:</h3>

            <Badge>{formattedStage}</Badge>
            </div>
            <h3 className="text-lg">Notes</h3>
            <Textarea disabled={!edit && !admin} value={proof.notes ?? ""} onChange={(e)=>proof.setNotes(e.target.value)}></Textarea>
            <h3 className="text-lg">Upload</h3>
            <Input
                type="file"
                accept="application/pdf"
                disabled={!edit && !admin}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />

        </CardContent>
        <CardFooter>
            <Button onClick={handleSubmit} disabled={!edit && !admin}>Submit</Button>
        </CardFooter>
    </Card>
}