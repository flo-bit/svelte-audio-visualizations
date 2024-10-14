import { onMount } from "svelte";

export async function raf(callback:()=>void){

	let mounted = true;

	async function render(){
		if(!mounted)return;
		callback();
		requestAnimationFrame(render);
	}

	onMount(()=>{
		render();
		return ()=>mounted = false;
	})
}