<?php
// Compatibility redirect: the static sign-in page is now public/index.html.
header('Location: index.html', true, 302);
exit;
