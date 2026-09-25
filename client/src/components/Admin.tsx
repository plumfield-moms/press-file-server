import {DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {useState} from "react";
import {toast} from "@/components/ui/toast.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Field, FieldGroup} from "@/components/ui/field.tsx";
import {Label} from "@/components/ui/label.tsx";
import {Input} from "@/components/ui/input.tsx";


export function Admin({submit}:{submit: (file: File, title: string)=>void}){
    const [file, setFile] = useState<File | null>()
    const [title, setTitle] = useState<string | null>()
    function handleSubmit(){
        if(!file || !title){
            toast.add({
                type: "error",
                description: "Please upload a file and a title"
            })
            return
        }
        submit(file,title)
        setFile(null)
        setTitle(null)
    }

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Create New Proof</DialogTitle>
            </DialogHeader>
            <FieldGroup>
                <Field>
                    <Label>Proof Title</Label>
                    <Input required value={title ?? ""} onChange={(e)=>setTitle(e.target.value)} />
                </Field>
                <Field>
                    <Label>Proof PDF</Label>
                    <Input
                        required
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />

                </Field>
            </FieldGroup>
            <DialogFooter>
                <DialogClose render={<Button variant={"outline"}>Cancel</Button>}/>
                <DialogClose render={<Button type={"submit"} onClick={()=>handleSubmit()}>Submit</Button>}/>
            </DialogFooter>

        </DialogContent>
    )
}