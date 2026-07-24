"""Inspecciona banners en https://lavozdiaria.netlify.app/ desktop y mobile."""
import json
from playwright.sync_api import sync_playwright

URL = "https://lavozdiaria.netlify.app/"

def inspect(page, label, screenshot_path):
    console_msgs = []
    page_errors = []
    failed_images = []
    page.on("console", lambda msg: console_msgs.append({
        "type": msg.type,
        "text": msg.text[:300],
    }))
    page.on("pageerror", lambda err: page_errors.append(str(err)[:500]))

    page.goto(URL, wait_until="networkidle", timeout=45000)
    page.wait_for_timeout(2500)

    # Save screenshot
    page.screenshot(path=screenshot_path, full_page=True)

    # Inspect all images - find ad-related ones
    imgs = page.locator("img").all()
    print(f"\n=== {label} ===")
    print(f"Total <img> tags: {len(imgs)}")
    ad_imgs = []
    for i, img in enumerate(imgs):
        try:
            src = img.get_attribute("src") or ""
            alt = img.get_attribute("alt") or ""
            natural = img.evaluate("el => ({naturalW: el.naturalWidth, naturalH: el.naturalHeight, complete: el.complete})")
            # Ad images typically from supabase storage
            is_ad = "supabase.co" in src and "storage" in src
            if is_ad:
                ad_imgs.append({
                    "i": i,
                    "src": src[:200],
                    "alt": alt[:80],
                    "naturalW": natural["naturalW"],
                    "naturalH": natural["naturalH"],
                    "complete": natural["complete"],
                })
        except Exception as e:
            print(f"  img {i} error: {e}")

    print(f"Ad images found: {len(ad_imgs)}")
    for a in ad_imgs:
        ok = a["complete"] and a["naturalW"] > 0
        status = "OK" if ok else "FAIL"
        print(f"  [{status}] {a['alt']} {a['naturalW']}x{a['naturalH']} {a['src'][:80]}")
        if not ok:
            failed_images.append(a)

    return {
        "label": label,
        "total_imgs": len(imgs),
        "ad_imgs": ad_imgs,
        "failed": failed_images,
        "console_errors": [m for m in console_msgs if m["type"] in ("error", "warning")],
        "page_errors": page_errors,
    }

def main():
    results = {}
    with sync_playwright() as p:
        # Desktop
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(
            viewport={"width": 1440, "height": 900},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
        )
        page = ctx.new_page()
        results["desktop"] = inspect(page, "Desktop", "screenshots/ads_desktop.png")
        browser.close()

        # Mobile
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(
            viewport={"width": 390, "height": 844},
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        )
        page = ctx.new_page()
        results["mobile"] = inspect(page, "Mobile", "screenshots/ads_mobile.png")
        browser.close()

    with open("scripts/ad_inspection.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    print("\n=== SUMMARY ===")
    for k, r in results.items():
        print(f"{k}: {len(r['ad_imgs'])} ad imgs, {len(r['failed'])} failed, {len(r['console_errors'])} console errors, {len(r['page_errors'])} page errors")

if __name__ == "__main__":
    main()