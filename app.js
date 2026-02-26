const path = require("path");
const fs = require("fs");
const express = require("express");
const multiparty = require("multiparty");
const { engine } = require("express-handlebars");

const app = express();
const PORT = process.env.PORT || 3000;

// Security: remove X-Powered-By header
app.disable("x-powered-by"); 

// View engine: Handlebars (main layout + partials)
app.engine('handlebars', engine({
  defaultLayout: 'main',              
  extname: '.handlebars',             
  partialsDir: ['views/partials/'],   
  helpers: {
    section: function(name, options) {
      if (!this._sections) this._sections = {};
      this._sections[name] = options.fn(this);
      return null;
    }
  }
}));

app.set('view engine', 'handlebars');
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));

// Static files (so /uploads/... renders)
app.use(express.static(path.join(__dirname, "public")));


global.reports = [
  {
    id: "1",
    name: "Blue Wallet",
    description: "Leather wallet with student ID",
    location: "Library Hall B",
    date: "2023-10-25",
    contact: "student@univ.edu",
    imagePath: "/uploads/filename.jpg",
    status: "Lost",
    imagePath: "/uploads/mock-wallet.jpg",
  },
  {
    id: "2",
    name: "Silver Water Bottle",
    description: "1L insulated bottle with stickers.",
    location: "Gym Entrance",
    date: "2026-02-24",
    contact: "owner2@example.com",
    status: "Found",
    imagePath: "",
  },
  {
    id: "3",
    name: "Blue Backpack",
    description: "Backpack with laptop charger and notebooks.",
    location: "Cafeteria",
    date: "2026-02-23",
    contact: "owner3@example.com",
    status: "Closed",
    imagePath: "/uploads/mock-backpack.jpg",
  },
]; 

function findReport(id) {
  return global.reports.find((r) => r.id === id);
}

function ensureUploadsDir() {
  const dir = path.join(__dirname, "public", "uploads");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// Routes
app.get("/", (req, res) => res.redirect("/report"));

// TODO: branch → feature/report-form
app.get("/report", (req, res) => {
  // render the report submission form
});

app.post("/report", (req, res) => {
  // handle form submission (multipart/form-data)
});

// TODO: branch → feature/dashboard
app.get("/dashboard", (req, res) => {
  app.get("/dashboard", (req, res) => {
  res.render("dashboard", {
    title: "Dashboard",
    reports: global.reports,
  });
});
});

// TODO: branch → feature/item-detail
app.get("/items/:id", (req, res) => {
  // render the detail view for a single item
  const report = findReport(req.params.id);
  if (!report) return res.status(404).send("Report not found");

  return res.render("item_detail", {
    title: `Item Detail - ${report.name}`,
    report,
  });
});

app.post("/items/:id/status", (req, res) => {
  const report = findReport(req.params.id);
  if (!report) return res.status(404).send("Report not found");

  const allowedStatuses = ["Lost", "Found", "Closed"];
  const nextStatus = req.body.status;

  if (!allowedStatuses.includes(nextStatus)) {
    return res.redirect(`/items/${req.params.id}`);
  }

  report.status = nextStatus;
  return res.redirect(`/items/${req.params.id}`);
});

app.post("/items/:id/delete", (req, res) => {
  global.reports = global.reports.filter((r) => r.id !== req.params.id);
  return res.redirect("/dashboard");
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
