/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var expect = require('chai').expect,
    nowdoc = require('nowdoc'),
    tools = require('../../../../tools');

describe('PHP "htmlspecialchars" builtin function integration', function () {
    it('should be able to encode a string', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$result[] = htmlspecialchars('My £10 <strong>HTML</strong> string & \'then\' "some"');
$result[] = htmlspecialchars('My £10 <strong>HTML</strong> string & \'then\' "some"', ENT_QUOTES);
$result[] = htmlspecialchars('My £10 <strong>HTML</strong> string & \'then\' "some"', ENT_NOQUOTES);

$result[] = htmlspecialchars('My £10 <strong>HTML</strong> &lt; string &amp; \'then\' "some"', ENT_QUOTES, 'UTF-8');
$result[] = htmlspecialchars('My £10 <strong>HTML</strong> &lt; string &amp; \'then\' "some"', ENT_QUOTES, 'UTF-8', false);

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.syncTranspile(null, php),
            engine = module();

        expect(engine.execute().getNative()).to.deep.equal([
            // NB: Unlike htmlentities(...), the pound £ symbol should be left untouched
            'My £10 &lt;strong&gt;HTML&lt;/strong&gt; string &amp; \'then\' &quot;some&quot;',
            'My £10 &lt;strong&gt;HTML&lt;/strong&gt; string &amp; &#039;then&#039; &quot;some&quot;',
            'My £10 &lt;strong&gt;HTML&lt;/strong&gt; string &amp; \'then\' "some"',

            // Testing double_encode parameter
            'My £10 &lt;strong&gt;HTML&lt;/strong&gt; &amp;lt; string &amp;amp; &#039;then&#039; &quot;some&quot;',
            'My £10 &lt;strong&gt;HTML&lt;/strong&gt; &lt; string &amp; &#039;then&#039; &quot;some&quot;'
        ]);
    });
});
