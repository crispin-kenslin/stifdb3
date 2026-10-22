#!/usr/bin/perl

$perl_script = $ARGV[0];
print $perl_script;

opendir DIR,"$ARGV[1]";
@dir = <DIR>;


while ($i = readdir(DIR))
{
        if($i =~ /(\w+)_full\d*/)
        {
                $file_name = $1;
                print "SS :: $i :: $var1\n";
                $cmd1 = "perl $perl_script\/sdevn.pl $ARGV[1]\/$i \> $ARGV[1]\/$file_name\.sd";
                #print "$cmd1\n";
                system($cmd1);

		$n++;
	}
}
print "CNT :: $n\n";
closedir(DIR);
