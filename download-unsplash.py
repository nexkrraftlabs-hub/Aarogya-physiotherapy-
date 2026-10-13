#!/usr/bin/env python3
"""Downloads Unsplash photos for every photo slot into assets/img/.

1) Free key: https://unsplash.com/oauth/applications  -> New Application -> copy the *Access Key*
2) Windows:  set UNSPLASH_ACCESS_KEY=your_key      Mac/Linux:  export UNSPLASH_ACCESS_KEY=your_key
3) python download-unsplash.py

Re-run to get different pictures: python download-unsplash.py --shuffle
Don't like one? Change its query below, or just drop your own .jpg with the same name in assets/img/.
Unsplash licence: free to use, credit to photographers is appreciated.
"""
import json, os, random, sys, urllib.parse, urllib.request

KEY = os.environ.get("UNSPLASH_ACCESS_KEY")
if not KEY:
    sys.exit("Set UNSPLASH_ACCESS_KEY first (see the top of this file).")
SHUFFLE = "--shuffle" in sys.argv

# file name : (search query, orientation, width)
PHOTOS = {
 "hero-home":("physiotherapist treating patient","landscape",2000),
 "about-hero":("physiotherapy clinic team","landscape",2000),
 "services-hero":("physiotherapy rehabilitation wheelchair","landscape",2000),
 "contact-hero":("medical team doctors smiling","landscape",2000),
 "why-1":("physiotherapist stretching patient","portrait",800),
 "why-2":("physical therapy exercise resistance band","landscape",900),
 "why-3":("rehabilitation therapy clinic","portrait",900),
 "svc-ndis":("senior man smiling portrait","landscape",900),
 "svc-shockwave":("shockwave therapy","landscape",900),
 "svc-ultrasound":("ultrasound therapy physiotherapy","landscape",900),
 "svc-workcover":("worker injury rehabilitation","landscape",900),
 "svc-dva":("elderly veteran portrait","landscape",900),
 "svc-cdm":("doctor patient consultation","landscape",900),
 "video-bg":("physiotherapist clinic exercise","landscape",2000),
 "steps-bg":("physiotherapy exercise ball","landscape",1400),
 "avatar-1":("woman portrait headshot","squarish",200),
 "avatar-2":("young man portrait headshot","squarish",200),
 "avatar-3":("woman smiling portrait","squarish",200),
 "avatar-4":("man smiling portrait","squarish",200),
 "avatar-5":("indian woman portrait","squarish",200),
 "faq-1":("physiotherapy massage","portrait",700),
 "faq-2":("physiotherapist clipboard nurse","portrait",700),
 "book-photo":("female physiotherapist smiling","landscape",1200),
 "contact-photo":("physiotherapists team smiling","landscape",1200),
 "about-philosophy":("physiotherapy exercise ball patient","landscape",1200),
 "about-different":("physiotherapist helping patient rehabilitation","landscape",1200),
 "gallery-1":("physiotherapy exercise","landscape",800),
 "gallery-2":("physiotherapy stretching","landscape",800),
 "gallery-3":("resistance band exercise","landscape",800),
 "gallery-4":("pilates studio","landscape",800),
 "gallery-5":("gym rehabilitation room","landscape",1400),
 "help-1":("physiotherapy elderly exercise","portrait",800),
 "help-2":("physiotherapist patient","portrait",900),
 "access-photo":("knee physiotherapy","portrait",1200),
 "first-video-bg":("doctor patient talking","landscape",1400),
 "svc-faq-1":("ultrasound physiotherapy device","portrait",700),
 "svc-faq-2":("physiotherapist writing notes","portrait",700),
}

def get(url):
    req = urllib.request.Request(url, headers={"Accept-Version": "v1", "User-Agent": "nordic-physio-site"})
    return urllib.request.urlopen(req, timeout=30)

root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets", "img")
os.makedirs(root, exist_ok=True)
used, failed = set(), []
for name, (q, orient, width) in PHOTOS.items():
    try:
        params = urllib.parse.urlencode({"query": q, "orientation": orient, "per_page": 12, "client_id": KEY})
        results = json.load(get("https://api.unsplash.com/search/photos?" + params))["results"]
        results = [r for r in results if r["id"] not in used]
        if not results: raise RuntimeError("no results")
        pick = random.choice(results[:8]) if SHUFFLE else results[0]
        used.add(pick["id"])
        try: get(pick["links"]["download_location"] + "&client_id=" + KEY).read()  # required by Unsplash API rules
        except Exception: pass
        img = pick["urls"]["raw"] + "&fm=jpg&q=80&fit=crop&w=%d" % width
        with get(img) as r, open(os.path.join(root, name + ".jpg"), "wb") as f:
            f.write(r.read())
        print("ok     %-18s by %s" % (name, pick["user"]["name"]))
    except Exception as e:
        failed.append(name); print("FAILED %-18s %s" % (name, e))
print("\nDone. %d ok, %d failed." % (len(PHOTOS) - len(failed), len(failed)))
