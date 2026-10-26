import re
def strip_comments(s):
    out=[];i=0;n=len(s);q=None
    while i<n:
        c=s[i]
        if q:
            out.append(c)
            if c=='\\' and i+1<n: out.append(s[i+1]);i+=2;continue
            if c==q:q=None
            i+=1;continue
        if c in '"\'':q=c;out.append(c);i+=1;continue
        if s.startswith('/*',i):
            j=s.find('*/',i+2);i=n if j<0 else j+2;continue
        out.append(c);i+=1
    return ''.join(out)
def find_block_end(s,i):
    # s[i]=='{'
    d=0;q=None;n=len(s)
    while i<n:
        c=s[i]
        if q:
            if c=='\\':i+=2;continue
            if c==q:q=None
        elif c in '"\'':q=c
        elif c=='{':d+=1
        elif c=='}':
            d-=1
            if d==0:return i
        i+=1
    return n
def parse(s,ctx=()):
    """yield (ctx tuple of at-rule preludes, selector, body)"""
    s=strip_comments(s) if not ctx else s
    i=0;n=len(s);res=[]
    while i<n:
        while i<n and s[i] in ' \t\r\n;':i+=1
        if i>=n:break
        if s[i]=='}':i+=1;continue
        j=i;q=None
        while j<n:
            c=s[j]
            if q:
                if c=='\\':j+=2;continue
                if c==q:q=None
            elif c in '"\'':q=c
            elif c in '{;':break
            j+=1
        if j>=n:break
        pre=s[i:j].strip()
        if s[j]==';':i=j+1;continue  # @import etc
        e=find_block_end(s,j);body=s[j+1:e]
        if pre.startswith('@media') or pre.startswith('@supports') or pre.startswith('@layer'):
            res+=parse(body,ctx+(pre,))
        elif pre.startswith('@'):
            res.append((ctx,pre,None))  # keyframes/font-face: keep raw marker
        else:
            res.append((ctx,pre,body))
        i=e+1
    return res
def decls(body):
    out=[];d=0;q=None;cur=''
    for c in body:
        if q:
            cur+=c
            if c==q:q=None
            continue
        if c in '"\'':q=c
        elif c=='(':d+=1
        elif c==')':d-=1
        if c==';' and d==0:
            out.append(cur);cur='';continue
        cur+=c
    out.append(cur)
    r=[]
    for x in out:
        if ':' in x and x.strip():
            k,v=x.split(':',1);r.append((k.strip().lower(),v.strip()))
    return r
