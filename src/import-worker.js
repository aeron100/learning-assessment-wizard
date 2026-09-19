import { safeText, checkZipDirectory } from './core.js';
import '../vendor/jszip.min.js';
self.onmessage=async({data})=>{
  try{
    if(data.buffer.byteLength>5*1024*1024)throw new Error('Choose a file no larger than 5 MB.');
    const bytes=new Uint8Array(data.buffer);let text;
    if(data.extension==='txt')text=new TextDecoder('utf-8',{fatal:true}).decode(bytes).replace(/^\uFEFF/,'');
    else if(data.extension==='docx'){
      checkZipDirectory(data.buffer);const zip=await self.JSZip.loadAsync(data.buffer);
      const xml=await new Promise((resolve,reject)=>{const chunks=[];let size=0;const stream=zip.file('word/document.xml').internalStream('uint8array');stream.on('data',chunk=>{size+=chunk.length;if(size>8*1024*1024){stream.pause();reject(new Error('Expanded document text exceeds the safe limit.'));return;}chunks.push(chunk);}).on('error',reject).on('end',()=>{const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}resolve(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}).resume();});
      if(/<!DOCTYPE|<!ENTITY|<w:object|<w:instrText/i.test(xml))throw new Error('This document contains embedded objects or active fields. Export a plain text copy.');
      // Send XML to DOMParser on the main thread; it is never inserted into the page.
      self.postMessage({xml});return;
    } else throw new Error('Unsupported file type.');
    self.postMessage({text:safeText(text)});
  }catch(e){self.postMessage({error:e.message||'Could not safely read this file.'});}
};
