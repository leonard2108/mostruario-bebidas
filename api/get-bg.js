export default function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  const fs = require("fs");
  const path = require("path");

  const file = path.join(process.cwd(), "public-bg.json");

  if (!fs.existsSync(file)) {
    return res.status(200).json({
      bgUrl: "",
      bgFit: "cover",
      bgPos: "center center",
      bgOpacity: "0.15"
    });
  }

  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  res.status(200).json(data);
}
