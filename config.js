exports.Expires = {
    fileMatch:/^(gif|png|jpg|js|css)$/ig,
    maxAge:10
};
exports.Compress = {
    match:/^(css|js|html)$/ig
}
exports.Welcome = {
    file: "index.html"
};