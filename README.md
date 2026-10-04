<div align="center">

  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=0,2,10,30,100&height=260&section=header&text=Enterprise%20SaaS%20WMS%20%26%20ERP%20Core&fontSize=42&fontColor=ffffff&animation=twinkling&fontAlignY=38" width="100%" alt="Header Banner"/>

  <p align="center">
    <a href="https://git.io/typing-svg">
      <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=23&duration=3000&pause=1000&color=6366F1&center=true&vCenter=true&repeat=true&width=650&height=50&lines=Ultra-Scale+Multi-Tenant+SaaS+%2B+WMS+Ecosystem;Amazon-Grade+PickPoint+Auto-Routing+%2B+Geo-Location;Granular+RBAC+Engine+%2B+Dynamic+Worker+Tasks;Async+Combobox+Handling+100k%2B+SKU+Inventory" alt="Typing SVG" />
    </a>
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/Architecture-Multi--Tenant_SaaS-8B5CF6?style=for-the-badge&logo=micro-strategy&logoColor=white" />
    <img src="https://img.shields.io/badge/Security-MarketAccessGuard_RBAC-EC4899?style=for-the-badge&logo=auth0&logoColor=white" />
    <img src="https://img.shields.io/badge/WMS-Task_Engine_%26_PickPoints-10B981?style=for-the-badge&logo=amazon&logoColor=white" />
    <img src="https://img.shields.io/badge/Status-Production_Grade-3B82F6?style=for-the-badge&logo=rocket&logoColor=white" />
  </p>

</div>

---

<br/>

<div align="center">
  <h2>🌐 Enterprise Architecture & Core Modules</h2>
  <p><i>High-Performance Monorepo Architecture for Scalable E-Commerce & Logistics Engine</i></p>
</div>

<br/>

<table width="100%" style="border-collapse: collapse; border: none;">
  <tr>
    <td width="33%" align="center" valign="top" style="border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 15px; background: rgba(255,255,255,0.02);">
      <h3>🛍️ Client App</h3>
      <p><code>/client</code></p>
      <hr/>
      <ul align="left">
        <li><b>Expo / React Native & Next.js</b></li>
        <li>Interactive Map Geo-Location</li>
        <li>Nearest <b>PickPoint (PVM)</b> Routing</li>
        <li>URL-Driven Product Options (UUID)</li>
        <li>Real-Time Order & Push Tracking</li>
      </ul>
    </td>
    <td width="33%" align="center" valign="top" style="border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 15px; background: rgba(255,255,255,0.02);">
      <h3>📊 Panel & WMS Dashboard</h3>
      <p><code>/panel</code></p>
      <hr/>
      <ul align="left">
        <li><b>Next.js 14/15 + Tailwind CSS</b></li>
        <li>Dynamic Permission UI (50+ Rules)</li>
        <li>Warehouse Tasks & Worker Dispatch</li>
        <li>Cascading Bins & Inventory Stock</li>
        <li>Live Recharts Analytics & Financials</li>
      </ul>
    </td>
    <td width="33%" align="center" valign="top" style="border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 15px; background: rgba(255,255,255,0.02);">
      <h3>⚙️ SaaS Core Backend</h3>
      <p><code>/server</code></p>
      <hr/>
      <ul align="left">
        <li><b>NestJS + Prisma ORM + PostgreSQL</b></li>
        <li>Centralized <code>MarketAccessGuard</code></li>
        <li>Multi-Tenant Market Isolation</li>
        <li>Debounced Async Combobox APIs</li>
        <li>Automated Stock Reservation Engine</li>
      </ul>
    </td>
  </tr>
</table>

<br/>

<div align="center">
  <table width="100%" style="border-collapse: collapse;">
    <tr>
      <td align="center" style="border: 1px dashed #6366F1; border-radius: 12px; padding: 20px; background: rgba(99, 102, 241, 0.05);">
        <h3>🛡️ Universal Security Guard Architecture</h3>
        <p><b>MarketAccessGuard Execution Chain:</b> <code>req.user.email</code> ➔ <code>Market Tenant</code> ➔ <code>Worker Entity</code> ➔ <code>Role Verification</code> ➔ <code>Granular Permission Array Check</code></p>
      </td>
    </tr>
  </table>
</div>

---

<br/>

## ⚡ Key Highlights & Enterprise Business Logic

<details>
<summary><b>🛡️ Dynamic RBAC & Universal MarketAccessGuard</b></summary>
<br/>

* **Zero Custom Guards:** Strictly enforced uniform execution guard pattern across all endpoint routes.
* **50+ Granular Permissions:** Fine-grained access management including `user:block`, `product:create`, `warehouse:income`, `warehouse:expense`, `worker:update`, and `pickpoint:manage`.
</details>

<details>
<summary><b>📦 Advanced WMS Topology & Task Dispatcher</b></summary>
<br/>

* **Bin-Level Isolation:** Automatic active warehouse locking with cascading Zone ➔ Bin ➔ Stock item dependency.
* **Audit-Logged Worker Tasks:** Tasks generated with explicit Unit of Measure (`KG`, `PCS`, `METER`, `LITRE`) and time-stamped step-by-step picking trails.
</details>

<details>
<summary><b>📍 Amazon-Grade PickPoint (PVM) Auto-Routing</b></summary>
<br/>

* **Geolocation Auto-Select:** Calculates customer latitude/longitude to dynamically route order fulfillments to the nearest warehouse-linked PickPoint.
</details>

<details>
<summary><b>🚀 Scalability & High-Load Optimization</b></summary>
<br/>

* **Async Search Combobox:** Built to handle 100,000+ SKU items gracefully via server-debounced pagination (`limit=20&search=...`).
* **URL State Synchronization:** Deep option linking (`?color=blue&size=xl`) maintaining cart UUID integrity throughout the checkout lifecycle.
</details>

---

<br/>

## 🛠️ Technology Stack

<div align="center">

| Core Layer | Technologies & Tools |
| :--- | :--- |
| **Frontend & Mobile** | `Next.js App Router`, `React Native / Expo`, `Tailwind CSS`, `Shadcn UI`, `Recharts` |
| **Backend & Security** | `NestJS Core`, `Prisma ORM`, `PostgreSQL`, `MarketAccessGuard Security Engine` |
| **Logistics & Maps** | `Leaflet / Mapbox Maps API`, `Geo-Distance Calculator`, `Push Notification Dispatcher` |
| **State & Data Handling** | `TanStack React Query`, `Zustand`, `Debounced Server Controls` |

</div>

---

<br/>

<div align="center">

  <h2>📊 Dynamic System Performance & Glass Analytics</h2>

  <br/>

  <p align="center">
    <img src="https://github-readme-stats.vercel.app/api?username=YOUR_GITHUB_USERNAME&show_icons=true&theme=glassmorphic&hide_border=true&count_private=true" width="48%" />
    <img src="https://github-readme-stats.vercel.app/api/top-langs/?username=YOUR_GITHUB_USERNAME&layout=compact&theme=glassmorphic&hide_border=true" width="48%" />
  </p>

  <p align="center">
    <img src="https://github-readme-streak-stats.herokuapp.com/?user=YOUR_GITHUB_USERNAME&theme=glassmorphic&hide_border=true" width="97%" />
  </p>

</div>

---

<div align="center">

  <br/>

  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=10,30,100,0,2&height=120&section=footer" width="100%"/>

  <p><sub>Engineered for Ultra-Scale SaaS, Logistics & Multi-Vendor Marketplace Systems</sub></p>

</div>