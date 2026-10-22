#!/usr/bin/env python3
"""Parse bounded arXiv Atom metadata; no PDF download or external entity resolution."""
import sys,json,xml.etree.ElementTree as ET
raw=sys.stdin.buffer.read(4_000_001)
if len(raw)>4_000_000 or b'<!DOCTYPE' in raw.upper() or b'<!ENTITY' in raw.upper():raise ValueError('Unsupported or oversized XML')
root=ET.fromstring(raw)
ns={'a':'http://www.w3.org/2005/Atom','o':'http://a9.com/-/spec/opensearch/1.1/','r':'http://arxiv.org/schemas/atom'}
if root.tag!='{http://www.w3.org/2005/Atom}feed':raise ValueError('Expected arXiv Atom feed')
def txt(node,key):return ' '.join((node.findtext(key,'',ns)).split())
entries=[]
for e in root.findall('a:entry',ns):
    ident=txt(e,'a:id')
    if not ident or 'api/errors' in ident:raise ValueError(txt(e,'a:summary') or 'Invalid arXiv entry')
    entries.append({'idURL':ident,'title':txt(e,'a:title'),'summary':txt(e,'a:summary'),'publishedAt':txt(e,'a:published'),'updatedAt':txt(e,'a:updated'),'authors':[txt(a,'a:name') for a in e.findall('a:author',ns)],'categories':[c.attrib['term'] for c in e.findall('a:category',ns)],'license':txt(e,'r:license')})
total=root.findtext('o:totalResults',None,ns)
if total is None:raise ValueError('Missing totalResults')
print(json.dumps({'total':int(total),'entries':entries},ensure_ascii=False))
